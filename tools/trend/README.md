# Steam tag snapshots

Research tooling for the tag set the game is measured against. Stdlib only (`urllib`), no keys, no logins.

```bash
python3 tools/trend/steam_tag_snapshot.py                 # writes tools/trend/snapshots/YYYY-MM-DD.csv
python3 tools/trend/steam_tag_snapshot.py --sleep 1.5     # gentler pacing
python3 tools/trend/steam_tag_snapshot.py --top 5 --out /tmp/snap
```

Tags: Liminal Space, Backrooms, Analog Horror, Psychological Horror, Dark Fantasy, Action RPG, Narrative,
Pixel Graphics, FMV.

## Endpoints

| purpose | endpoint |
|---|---|
| games per tag (top by owners) | `https://steamspy.com/api.php?request=tag&tag=<tag>` |
| live player count | `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=<appid>` |

SteamSpy reports owners as a band (`"50,000 .. 100,000"`), so ranking uses the band's lower bound; the original
band is kept in the CSV. Ties break on name so reruns produce a stable file.

Encode spaces in the tag as `+` (`urllib.parse.quote_plus`). SteamSpy returns `{}` for `%20`-encoded spaces, which
looks like "tag has no games" but is only the encoding.

SteamSpy's tag taxonomy is its own snapshot and does not cover every Steam tag. On 2026-11-23 it returned games for
Pixel Graphics, Psychological Horror and Action RPG, and `{}` for Backrooms, Liminal Space, Analog Horror, Dark
Fantasy, Narrative and FMV; those are recorded with an `error` value and the run exits non-zero, by design.

## Rate limit

One request per second by default (`--sleep`), which keeps a full run at about 100 requests (~9 tags plus up to
10 games each). SteamSpy throttles aggressively above a few requests per second; do not lower `--sleep` for a full
run.

## Output

`tools/trend/snapshots/YYYY-MM-DD.csv`, columns: `tag, rank, appid, name, owners, current_players, error`.

If a tag or a player count cannot be fetched, the row carries the message in `error` and the script exits non-zero.
Counts are never invented; a failed row is better than a guessed number.
