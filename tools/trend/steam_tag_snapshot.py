#!/usr/bin/env python3
"""Steam tag snapshot (queue entry 8). Python 3 stdlib only, no keys and no logins.

For each tag: take the top 10 games by owners from SteamSpy's public tag endpoint, then Steam's public
GetNumberOfCurrentPlayers for those app ids. Writes tools/trend/snapshots/YYYY-MM-DD.csv (one row per game, with
its tag and rank) and prints a summary.

Public endpoints only, one request per second. If a tag or a player count cannot be fetched the CSV records the
error in its `error` column and the run exits non-zero - player counts are never invented.

    python3 tools/trend/steam_tag_snapshot.py
    python3 tools/trend/steam_tag_snapshot.py --sleep 0.5 --top 5 --out /tmp/snap

SteamSpy reports owners as a band ("50,000 .. 100,000"), so ranking uses the band's lower bound and the original
string is kept in the CSV. Ties break on name for a stable file.
"""
import argparse
import csv
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

TAGS = [
    'Liminal Space',
    'Backrooms',
    'Analog Horror',
    'Psychological Horror',
    'Dark Fantasy',
    'Action RPG',
    'Narrative',
    'Pixel Graphics',
    'FMV',
]
TAG_URL = 'https://steamspy.com/api.php?request=tag&tag={tag}'
PLAYERS_URL = 'https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid={appid}'
FIELDS = ['tag', 'rank', 'appid', 'name', 'owners', 'current_players', 'error']
USER_AGENT = 'lantern-night-trend-snapshot/1.0 (+https://github.com/ennist1989-prog/lantern-night)'


def get_json(url, timeout=30):
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT, 'Accept': 'application/json'})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode('utf-8'))


def owners_floor(band):
    """Lower bound of a SteamSpy owners band, for ordering only."""
    try:
        return int(str(band).split('..')[0].replace(',', '').strip())
    except (ValueError, AttributeError):
        return 0


def main(argv=None):
    ap = argparse.ArgumentParser(description='Top games per Steam tag plus their live player counts.')
    ap.add_argument('--out', default='tools/trend/snapshots', help='output directory')
    ap.add_argument('--top', type=int, default=10, help='games per tag (default 10)')
    ap.add_argument('--sleep', type=float, default=1.0, help='seconds between requests (default 1.0)')
    ap.add_argument('--date', default=None, help='override the file date (UTC YYYY-MM-DD)')
    args = ap.parse_args(argv)

    os.makedirs(args.out, exist_ok=True)
    date = args.date or datetime.now(timezone.utc).strftime('%Y-%m-%d')
    path = os.path.join(args.out, f'{date}.csv')
    rows, errors = [], []

    for tag in TAGS:
        try:
            # quote_plus, not quote: SteamSpy's tag parameter only resolves '+' for spaces (%20 returns {})
            data = get_json(TAG_URL.format(tag=urllib.parse.quote_plus(tag)))
        except Exception as e:                      # noqa: BLE001 - reported, not raised
            msg = f'tag endpoint failed: {type(e).__name__}: {e}'
            errors.append(f'{tag}: {msg}')
            rows.append({'tag': tag, 'rank': '', 'appid': '', 'name': '', 'owners': '',
                         'current_players': '', 'error': msg})
            time.sleep(args.sleep)
            continue
        time.sleep(args.sleep)

        games = []
        for appid, app in (data or {}).items():
            if not isinstance(app, dict):
                continue
            games.append((owners_floor(app.get('owners')), appid, app.get('name') or '', app.get('owners') or ''))
        games.sort(key=lambda g: (-g[0], g[2].lower()))

        if not games:
            msg = 'tag endpoint returned no games'
            errors.append(f'{tag}: {msg}')
            rows.append({'tag': tag, 'rank': '', 'appid': '', 'name': '', 'owners': '',
                         'current_players': '', 'error': msg})
            continue

        for rank, (_floor, appid, name, owners) in enumerate(games[:args.top], start=1):
            players, err = '', ''
            try:
                payload = get_json(PLAYERS_URL.format(appid=appid))
                response = (payload or {}).get('response') or {}
                if response.get('result') == 1 and 'player_count' in response:
                    players = response['player_count']
                else:
                    err = f'player count unavailable (result={response.get("result")})'
            except Exception as e:                  # noqa: BLE001
                err = f'player endpoint failed: {type(e).__name__}: {e}'
            if err:
                errors.append(f'{tag} appid {appid}: {err}')
            rows.append({'tag': tag, 'rank': rank, 'appid': appid, 'name': name, 'owners': owners,
                         'current_players': players, 'error': err})
            time.sleep(args.sleep)

    with open(path, 'w', newline='', encoding='utf-8') as fh:
        writer = csv.DictWriter(fh, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)

    covered = {r['tag'] for r in rows}
    print(f'{path}: {len(rows)} row(s) across {len(covered)}/{len(TAGS)} tag(s), '
          f'{sum(1 for r in rows if r["current_players"] != "")} with a live player count')
    missing = [t for t in TAGS if t not in covered]
    if missing:
        print(f'  no rows for: {", ".join(missing)}')
    if errors:
        print(f'  {len(errors)} error(s); see the error column')
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
