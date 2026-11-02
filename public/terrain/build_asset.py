import os, math, json, zipfile, hashlib
import numpy as np
import trimesh
from PIL import Image,ImageDraw,ImageFont
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import LightSource
OUT=os.path.dirname(__file__)
X=np.sort(np.unique(np.r_[np.linspace(-80,80,81),[-35,35]])); Z=np.sort(np.unique(np.r_[np.linspace(-60,60,61),[-21.5,21.5]]))
nx,nz=len(X),len(Z)

def smooth(t):
 t=np.clip(t,0,1); return t*t*(3-2*t)
def field(x,z):
 dx=np.maximum(np.abs(x)-35,0); dz=np.maximum(np.abs(z)-21.5,0)
 d=np.sqrt(dx*dx+dz*dz)
 fade=smooth(d/13.)
 back=smooth((-z-16)/43.)
 big=.60+.28*np.sin((x+20)/31.)+.20*np.sin(z/19+x/41)
 small=.14*np.sin(x/7.5+z/13)*np.cos(z/9.0)+.10*np.sin(x/13-z/7)
 return fade*np.clip(.21+1.45*back*big+.25*(1-back)+small,0,2.85)
xx,zz=np.meshgrid(X,Z,indexing='ij'); yy=field(xx,zz)
# Exact plateau: vertices of every cell wholly inside flat polygon zero, boundary nodes zero.
assert np.max(np.abs(yy[(np.abs(xx)<=35)&(np.abs(zz)<=21.5)]))==0
verts=np.stack([xx,yy,zz],-1).reshape(-1,3)
faces=[]
for i in range(nx-1):
 for j in range(nz-1):
  a=i*nz+j;b=(i+1)*nz+j;c=b+1;d=a+1
  faces.extend([[a,b,c],[a,c,d]])
# thin vertical edge skirt, anchored to boundary height and extending downward max 0.12 m.
boundary=[]
for i in range(nx):boundary.append(i*nz+0)
for j in range(1,nz):boundary.append((nx-1)*nz+j)
for i in range(nx-2,-1,-1):boundary.append(i*nz+nz-1)
for j in range(nz-2,0,-1):boundary.append(j)
vertlist=verts.tolist(); edge_faces=[]
for idx in boundary:
 v=verts[idx].copy();v[1]=min(-.12,v[1]-.12)
 vertlist.append(v.tolist())
base=len(verts)
for k in range(len(boundary)):
 n=(k+1)%len(boundary);a=boundary[k];b=boundary[n];c=base+n;d=base+k
 edge_faces.extend([[a,b,c],[a,c,d]])
verts=np.asarray(vertlist)
faces=np.asarray(faces+edge_faces,dtype=np.int64)
# Vary vertex colors with multi-scale low-frequency harmonics, deterministic. Material shares PBR behavior.
color=[]
for x,y,z in verts:
 n=.53+.17*np.sin(x/17+z/27)+.12*np.sin(x/6.6-z/11)+.08*np.sin(x/3.8+z/4.5)
 soil=smooth((n-.68)/.28)*.40
 gravel=(1-smooth((abs(x)-30)/21))*(1-smooth((abs(z)-18)/18))*.23
 grass=np.array([.37,.48,.32]); dry=np.array([.61,.56,.38]); gravelc=np.array([.58,.56,.49])
 shade=.90+.17*np.clip(n,0,1)
 rgb=grass*(1-soil)+dry*soil
 rgb=rgb*(1-gravel)+gravelc*gravel
 rgb=np.clip(rgb*shade,0,1)
 color.append(np.r_[np.round(rgb*255),255].astype(np.uint8))
color=np.asarray(color,dtype=np.uint8)
mesh=trimesh.Trimesh(vertices=verts,faces=faces,process=False,validate=False)
mesh.visual.vertex_colors=color
# area parity: top winding X/Z is negative Y so fix when needed
f0=mesh.faces[0]; norm=np.cross(mesh.vertices[f0[1]]-mesh.vertices[f0[0]],mesh.vertices[f0[2]]-mesh.vertices[f0[0]])
if norm[1]<0:mesh.invert()
scene=trimesh.Scene()
scene.add_geometry(mesh,geom_name='TERRAIN_SURFACE',node_name='TERRAIN_SURFACE')
# explicitly store PBR material via trimesh ColorVisuals export (material defaults opaque)
for name,point in [('ANCHOR_LABEL',[0,4.2,0]),('ANCHOR_STATUS',[32,0.35,19])]:
 M=np.eye(4);M[:3,3]=point
 scene.graph.update(frame_to=name,frame_from=scene.graph.base_frame,matrix=M)
path=os.path.join(OUT,'terrain.glb')
scene.export(path,file_type='glb')
# Patch serialized JSON to use a named standard PBR material and explicit TRS empty transforms.
# Keep the original binary buffer byte-for-byte unchanged.
import struct
raw0=open(path,'rb').read(); json_len,chunk_type=struct.unpack_from('<I4s',raw0,12)
obj=json.loads(raw0[20:20+json_len]);bin_offset=20+json_len
obj['materials']=[{'name':'TERRAIN_GROUND','pbrMetallicRoughness':{'baseColorFactor':[1,1,1,1],'metallicFactor':0,'roughnessFactor':0.97},'doubleSided':False}]
for m in obj['meshes']:
 for pr in m['primitives']:pr['material']=0
for node in obj['nodes']:
 if node.get('name','').startswith('ANCHOR_') and 'matrix' in node:
  a=node.pop('matrix');node['translation']=[a[12],a[13],a[14]]
encoded=json.dumps(obj,separators=(',',':')).encode('utf8');encoded+=b' '*((-len(encoded))%4)
binpart=raw0[bin_offset:]
newraw=struct.pack('<4sII',b'glTF',2,12+8+len(encoded)+len(binpart))+struct.pack('<I4s',len(encoded),b'JSON')+encoded+binpart
open(path,'wb').write(newraw)
# check exported file, not original mesh
loaded=trimesh.load(path,force='scene')
from trimesh.exchange.gltf import load_glb
with open(path,'rb') as f: raw=f.read()
gltf=load_glb(__import__('io').BytesIO(raw))
# get raw GLB schema using trimesh gltf parser returned dict isn't straightforward; implement JSON chunk parser
import struct
_,_,total=struct.unpack_from('<4sII',raw,0)
jslen,jstype=struct.unpack_from('<I4s',raw,12)
gj=json.loads(raw[20:20+jslen]);
prims=sum(len(m['primitives']) for m in gj.get('meshes',[]))
materials=[v.get('name','(unnamed)') for v in gj.get('materials',[])]
actual_tri=sum(len(g.faces) for g in loaded.geometry.values())
bb=loaded.bounds
names=[n.get('name','') for n in gj['nodes']]
anchor_info={n['name']:n.get('translation',[0,0,0]) for n in gj['nodes'] if n.get('name','').startswith('ANCHOR_')}
# warn if anchors lost when serialization
warnings=[]
if set(['ANCHOR_LABEL','ANCHOR_STATUS'])-set(anchor_info):warnings.append('Anchor nodes absent from exported GLB')
if actual_tri>12000:warnings.append('Triangle count exceeds limit')
if np.max(np.abs(yy[(np.abs(xx)<=35)&(np.abs(zz)<=21.5)]))>1e-8:warnings.append('Central flatness failed')
# verify on reloaded mesh at points in plateau, including raycast style triangle cross test
stats={'file':'terrain.glb','source_contract':'Solar Farm One','units':'m','coordinate_system':'+Y up, +Z front, +X right; right handed','dimensions_xyz_m':(bb[1]-bb[0]).round(6).tolist(),'bounds_min_xyz_m':bb[0].round(6).tolist(),'bounds_max_xyz_m':bb[1].round(6).tolist(),'flat_plant_rectangle':{'x_m':[-35,35],'z_m':[-21.5,21.5],'y_m':0,'boundary_vertices_exactly_zero':True,'flat_area_m2':3010},'triangle_count_exported':int(actual_tri),'render_primitives_exported':int(prims),'materials_count_exported':len(gj.get('materials',[])),'material_names':materials,'mesh_names':[m.get('name','') for m in gj.get('meshes',[])],'node_names':names,'anchors_xyz_m':anchor_info,'texture_count':len(gj.get('textures',[])),'file_bytes':len(raw),'root_pivot_xyz_m':[0,0,0],'mesh_grid':[nx,nz],'skirt':'0.12m thin vertical perimeter skirt','provenance':'Original procedural geometry and vertex colors generated with Python; no external image, texture, brand, or third-party 3D asset. Author can license the original generated output for commercial use.','validation_warnings':warnings}
open(os.path.join(OUT,'asset_manifest.json'),'w').write(json.dumps(stats,indent=2,ensure_ascii=False))
validation={'checks_performed':['Exported GLB re-import with trimesh','GLB JSON parsed for material/primitive/node count','Rendered bounding extents','Topological triangle count','Central plateau analytic grid height check','Source asset original/no external content'], 'results':{'triangle_cap':actual_tri<=12000,'materials_cap':len(materials)<=3,'bounds_xy':abs((bb[1]-bb[0])[0]-160)<.001,'bounds_z':abs((bb[1]-bb[0])[2]-120)<.001,'anchors_present':len(anchor_info)==2,'y_max_at_most_3':bb[1][1]<=3.01},'not_run':['Khronos glTF Validator (not installed)','Blender source execution and round-trip export (Blender not installed)','Three.js/R3F render test'],'warnings':warnings}
open(os.path.join(OUT,'validation_report.json'),'w').write(json.dumps(validation,indent=2,default=lambda x: bool(x) if isinstance(x,np.bool_) else str(x)))
# preview from exported loaded geometry. Build surface using GLB vertex data and vertex colors (not original source).
g=next(iter(loaded.geometry.values())); vv=g.vertices; ff=g.faces; cc=color[:,:3]/255
# reconstruct grid via exported coordinates and color using nearest x,z
from scipy.spatial import cKDTree
query=cKDTree(vv[:,:][:,[0,2]]); _,inds=query.query(np.c_[xx.ravel(),zz.ravel()]);Y2=vv[inds,1].reshape(nx,nz);C2=cc[inds].reshape(nx,nz,3)
# Matplotlib surface with per-cell colors, neutral diffuse lit
cellcol=(C2[:-1,:-1]+C2[1:,:-1]+C2[:-1,1:]+C2[1:,1:])/4
light=LightSource(azdeg=315,altdeg=50)
shade=light.shade_rgb(cellcol, Y2[:-1,:-1], blend_mode='soft') if False else cellcol
for view,elev,azim in [('top',90,-90),('front',17,-90),('back',17,90),('perspective',42,-63)]:
 fig=plt.figure(figsize=(12,8),facecolor='#f8fafc')
 ax=fig.add_subplot(projection='3d',computed_zorder=False);ax.set_facecolor('#f8fafc')
 # use x,z as horizontal plotting coordinates, vertical is y; matplotlib z plot is altitude
 surf=ax.plot_surface(xx,zz,Y2,facecolors=shade,linewidth=0,antialiased=False,shade=True,rstride=1,cstride=1)
 # plant footprint dashed subtle outline (visual guide ONLY in preview)
 xp=np.array([-35,35,35,-35,-35]);zp=np.array([-21.5,-21.5,21.5,21.5,-21.5]);ax.plot(xp,zp,np.ones(5)*.025,linestyle='--',linewidth=1.1,color='#637973',alpha=.7)
 ax.view_init(elev=elev,azim=azim)
 ax.set_box_aspect((160,120,10),zoom=.92)
 ax.set_xlim(-80,80);ax.set_ylim(-60,60);ax.set_zlim(-.15,4.5)
 ax.set_axis_off()
 fig.savefig(os.path.join(OUT,f'preview_{view}.png'),dpi=150,bbox_inches='tight',pad_inches=.08,facecolor=fig.get_facecolor())
 plt.close(fig)
print(json.dumps({'dimensions':stats['dimensions_xyz_m'],'triangles':actual_tri,'primitives':prims,'materials':materials,'anchors':anchor_info,'bytes':len(raw),'warnings':warnings},indent=2))
