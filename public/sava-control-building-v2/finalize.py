import os,json,base64,zlib,zipfile
import numpy as np,trimesh
from PIL import Image
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
R=os.path.dirname(os.path.abspath(__file__))
scene=trimesh.load(os.path.join(R,'control-building.glb'),force='scene')
meshes={k:scene.geometry[k] for k in ('CB_WALLS','CB_ROOF','CB_WINDOWS','CB_DETAILS')}
# Serialize geometry in the standalone Blender source using only Python built-ins at runtime
payload={}
for n,m in meshes.items():payload[n]={'vertices':np.round(m.vertices,6).tolist(),'faces':m.faces.tolist()}
packed=base64.b64encode(zlib.compress(json.dumps(payload,separators=(',',':')).encode(),9)).decode()
script='''# Blender 4.2+ standalone source; Blender Python built-in bpy, json, zlib, base64 only.
# Rebuilds the measured original vertex geometry and exports GLB in Y-up coordinates.
import bpy, json, zlib, base64, os
from mathutils import Vector
GEOMETRY_BASE64 = "'''+packed+'''"
G=json.loads(zlib.decompress(base64.b64decode(GEOMETRY_BASE64)).decode())
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
colors={'CB_WALLS':(0.929,0.941,0.918,1),'CB_ROOF':(0.404,0.506,0.569,1),'CB_WINDOWS':(0.133,0.188,0.231,1),'CB_DETAILS':(0.412,0.537,0.596,1)}
for name,geo in G.items():
    # Source vertices already use the export Y-up convention; rotate into Blender Z-up.
    verts=[(x,-z,y) for x,y,z in geo['vertices']]
    # Proper rotation (det +1), maintains outward winding.
    mesh=bpy.data.meshes.new(name); mesh.from_pydata(verts,[],geo['faces']); mesh.update()
    obj=bpy.data.objects.new(name,mesh); bpy.context.collection.objects.link(obj)
    mat=bpy.data.materials.new(name); mat.diffuse_color=colors[name]; mat.use_nodes=True
    bsdf=mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value=colors[name]
    bsdf.inputs['Metallic'].default_value=0.48 if name in ('CB_ROOF','CB_DETAILS') else 0.12
    bsdf.inputs['Roughness'].default_value=0.48 if name in ('CB_ROOF','CB_DETAILS') else 0.76
    obj.data.materials.append(mat)
for name,xyz in {'ANCHOR_LABEL':(0,3.76,1.55),'ANCHOR_STATUS':(2.22,2.65,1.9)}.items():
    obj=bpy.data.objects.new(name,None); bpy.context.collection.objects.link(obj)
    obj.location=(xyz[0],-xyz[2],xyz[1]); obj.empty_display_type='PLAIN_AXES'
root=bpy.data.objects.new('ROOT',None);bpy.context.collection.objects.link(root)
for obj in tuple(bpy.context.scene.objects):
    if obj != root:obj.parent=root; obj.matrix_parent_inverse.identity()
# Blender glTF exporter converts source Z-up to glTF Y-up by default.
output=os.path.join(os.path.dirname(bpy.data.filepath) if bpy.data.filepath else os.getcwd(),'control-building.glb')
bpy.ops.export_scene.gltf(filepath=output,export_format='GLB',export_yup=True,export_apply=True,export_materials='EXPORT',export_cameras=False,export_lights=False)
print('Exported',output)
'''
open(os.path.join(R,'source.py'),'w').write(script)
# Visualize actual GLB geometry, not invented concept art, using neutral matplotlib 3D orthographic projections.
colors={'CB_WALLS':'#edf0ea','CB_ROOF':'#678191','CB_WINDOWS':'#22303b','CB_DETAILS':'#698998'}
for view,(elev,azim) in {'front':(8,-90),'back':(8,90),'top':(90,-90),'perspective':(33,-57)}.items():
 fig=plt.figure(figsize=(9,6.75),dpi=155,facecolor='#f7f8f9')
 ax=fig.add_axes([0.02,0.015,.96,.97],projection='3d',computed_zorder=False)
 ax.set_facecolor('#f7f8f9')
 # glTF x right y up z front => matplotlib x = x, y = -z, z = y
 for order,(name,m) in enumerate(meshes.items()):
    vertices=m.vertices; faces=m.faces
    a=np.column_stack((vertices[:,0],-vertices[:,2],vertices[:,1]));tri=a[faces]
    co=Poly3DCollection(tri,facecolors=colors[name],edgecolors='none',alpha=1,zorder=order+1)
    ax.add_collection3d(co)
 ax.set(xlim=(-3.6,3.6),ylim=(-2.65,2.65),zlim=(-.2,4.4));ax.set_box_aspect((7.2,5.3,4.6),zoom=.91)
 ax.view_init(elev=elev,azim=azim);ax.set_axis_off();ax.set_proj_type('ortho')
 fig.savefig(os.path.join(R,'preview_'+view+'.png'),facecolor='#f7f8f9',bbox_inches='tight',pad_inches=.05)
 plt.close(fig)
with zipfile.ZipFile('/mnt/data/control-building.zip','w',compression=zipfile.ZIP_DEFLATED,compresslevel=7) as z:
 for name in ['control-building.glb','source.py','build_asset.py','asset_manifest.json','validation_report.json']+[f'preview_{x}.png' for x in ('front','back','top','perspective')]:z.write(os.path.join(R,name),name)
with zipfile.ZipFile('/mnt/data/control-building.zip') as z:
 assert z.testzip() is None
 print('ZIP valid',[(x.filename,x.file_size) for x in z.infolist()])
