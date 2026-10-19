"""Side quest importer: copies rpg-research/data/sidequests.json to public/data/sidequests.json (loader source for all chapters)
and generates quest-log entries in quests.json for every quest with chapter <= CHAPTER_CAP that is not already hand-authored."""
import json, os, re
SRC = '/workspace/rpg-research/data/sidequests.json'
PUB = os.path.join(os.path.dirname(__file__), '..', 'public')
CHAPTER_CAP = 2
LEGACY = {'sq01': 'hanzo', 'sq02': 'chime'}   # already hand-built quests in the slice (their log entries stay as authored)
def build():
    d = json.load(open(SRC))
    out = {'schema': d.get('schema'), 'offeringItem': 'chime_offering', 'legacy': LEGACY, 'quests': {}}
    qp = os.path.join(PUB, 'data/quests.json'); Q = json.load(open(qp))
    items = json.load(open(os.path.join(PUB, 'data/items.json')))
    for q in d['quests']:
        r = q.get('reward', {})
        out['quests'][q['id']] = {'id': q['id'], 'name': q['name'], 'chapter': q['chapter'], 'type': q.get('type'), 'giver': q.get('giver', {}).get('name'),
            'steps': q.get('steps', []), 'zones': q.get('zones', []), 'estMinutes': q.get('estMinutes'),
            'reward': {'gold': r.get('gold', 0), 'items': r.get('items', []), 'keyItems': r.get('keyItems', []), 'nameFragments': r.get('nameFragments', 0), 'bondOfferings': r.get('bondOfferings', 0)},
            'implemented': q['chapter'] <= CHAPTER_CAP}
        if q['chapter'] <= CHAPTER_CAP and q['id'] not in LEGACY:
            st = [re.sub(r'^\[[^\]]*\]\s*', '', s) for s in q['steps']]
            names = [items.get(i['id'], {}).get('name', i['id']) + (' ×%d' % i['qty'] if i['qty'] > 1 else '') for i in r.get('items', [])]
            if r.get('nameFragments'): names.append('Name Fragment ×%d' % r['nameFragments'])
            if r.get('bondOfferings'): names.append('Offerings ×%d' % r['bondOfferings'])
            Q[q['id']] = {'name': q['name'], 'desc': st[0], 'stages': st[:2] if q['id'] == 'sq03' else st[:2], 'reward': ', '.join(names), 'doneText': q.get('twist', ''), 'sq': q['id']}
    for sid, lid in LEGACY.items():
        if lid in Q: Q[lid]['sq'] = sid
    json.dump(out, open(os.path.join(PUB, 'data/sidequests.json'), 'w'), ensure_ascii=False)
    json.dump(Q, open(qp, 'w'), ensure_ascii=False, indent=1)
    print('sidequests: %d total, %d implemented (ch<=%d)' % (len(out['quests']), sum(1 for q in out['quests'].values() if q['implemented']), CHAPTER_CAP))
if __name__ == '__main__': build()
