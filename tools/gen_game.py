import sys, os
sys.path.insert(0, os.path.dirname(__file__))
import gen_db
from mapkit import *
from maps_village import build_village
from maps_rest import *
from maps_ch3 import build_forest, build_grove, build_crossing, build_hollow
gen_db.write()
import subprocess; subprocess.check_call([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'spec_import.py')], cwd=os.path.dirname(os.path.abspath(__file__)))
subprocess.check_call([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'items_import.py')], cwd=os.path.dirname(os.path.abspath(__file__)))
subprocess.check_call([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sq_import.py')], cwd=os.path.dirname(os.path.abspath(__file__)))
subprocess.check_call([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'balance_patches.py')], cwd=os.path.dirname(os.path.abspath(__file__)))
for _t in ('ch3_assets.py', 'ch3_data.py'): subprocess.check_call([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), _t)], cwd=os.path.dirname(os.path.abspath(__file__)))
maps = [build_village(), build_sachi(), build_tea(), build_well(), build_shrine1(), build_summit(), build_forest(), build_grove(), build_crossing(), build_hollow()]
os.makedirs(os.path.join(ROOT, 'screenshots', 'maps'), exist_ok=True)
for m in maps:
    m.save()
    for r in ('near', 'far'): m.preview(r, os.path.join(ROOT, 'screenshots', 'maps', f'map{m.id}_{r}.png'), debug=(len(sys.argv) > 1 and sys.argv[1] == 'debug'))
print('maps:', [m.id for m in maps])
