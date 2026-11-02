"""Solar Farm One terrain, Blender 4.2+; run: blender -b --python source.py
Uses Blender built-in Python modules only. Creates terrain.glb and source_manifest.json
beside this script. No internet, plugins or external files required.
"""
import bpy, math, json, os
from math import sin, cos, sqrt

def smooth(v):
    v=max(0.,min(1.,v));return v*v*(3-2*v)
def height(x,z):
    dx=max(abs(x)-35,0); dz=max(abs(z)-21.5,0)
    d=sqrt(dx*dx+dz*dz); fade=smooth(d/13.)
    back=smooth((-z-16)/43.)
    big=.60+.28*sin((x+20)/31.)+.20*sin(z/19+x/41)
    small=.14*sin(x/7.5+z/13)*cos(z/9)+.10*sin(x/13-z/7)
    return fade*max(0.,min(2.85,.21+1.45*back*big+.25*(1-back)+small))

def color(x,z):
    n=.53+.17*sin(x/17+z/27)+.12*sin(x/6.6-z/11)+.08*sin(x/3.8+z/4.5)
    soil=smooth((n-.68)/.28)*.4
    gravel=(1-smooth((abs(x)-30)/21))*(1-smooth((abs(z)-18)/18))*.23
    grass=(.37,.48,.32);dry=(.61,.56,.38);stone=(.58,.56,.49)
    shade=.90+.17*max(0,min(1,n))
    return tuple(max(0,min(1,((grass[k]*(1-soil)+dry[k]*soil)*(1-gravel)+stone[k]*gravel)*shade)) for k in range(3))+(1.,)

bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.context.scene.unit_settings.system='METRIC';bpy.context.scene.unit_settings.scale_length=1.0
xs=sorted(set([-80+2*i for i in range(81)]+[-35.,35.]))
zs=sorted(set([-60+2*j for j in range(61)]+[-21.5,21.5]))
nx,nz=len(xs),len(zs)
verts=[(x,height(x,z),z) for x in xs for z in zs]
faces=[]
for i in range(nx-1):
    for j in range(nz-1):
        a=i*nz+j;b=(i+1)*nz+j;c=b+1;d=a+1
        faces.extend(((a,c,b),(a,d,c))) # correct upward normals
border=[i*nz for i in range(nx)]+[(nx-1)*nz+j for j in range(1,nz)]+[i*nz+(nz-1) for i in range(nx-2,-1,-1)]+[j for j in range(nz-2,0,-1)]
base=len(verts)
for idx in border:
    x,y,z=verts[idx];verts.append((x,min(-.12,y-.12),z))
for k in range(len(border)):
    nxt=(k+1)%len(border);a=border[k];b=border[nxt];c=base+nxt;d=base+k
    faces.extend(((a,b,c),(a,c,d)))
me=bpy.data.meshes.new('TERRAIN_SURFACE');me.from_pydata(verts,[],faces);me.update()
obj=bpy.data.objects.new('TERRAIN_SURFACE',me);bpy.context.collection.objects.link(obj)
# PBR: opaque rough nonmetallic, color detail from COLOR_0 vertex attributes
mat=bpy.data.materials.new('TERRAIN_GROUND');mat.use_nodes=True
bsdf=mat.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Metallic'].default_value=0;bsdf.inputs['Roughness'].default_value=.97
attr=mat.node_tree.nodes.new('ShaderNodeVertexColor');attr.layer_name='TERRAIN_COLOR'
mat.node_tree.links.new(attr.outputs['Color'],bsdf.inputs['Base Color']);me.materials.append(mat)
col=me.vertex_colors.new(name='TERRAIN_COLOR')
for poly in me.polygons:
    for loop_idx in poly.loop_indices:
        vi=me.loops[loop_idx].vertex_index
        x,y,z=verts[vi];col.data[loop_idx].color=color(x,z)
# Explicit identity root (empty); its children have identity scales
root=bpy.data.objects.new('ROOT',None);bpy.context.collection.objects.link(root)
obj.parent=root
for name,loc in [('ANCHOR_LABEL',(0,4.2,0)),('ANCHOR_STATUS',(32,.35,19))]:
    empty=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(empty)
    empty.parent=root;empty.location=loc;empty.empty_display_type='PLAIN_AXES';empty.empty_display_size=.1
# Only geometry + empty nodes exported
bpy.ops.object.select_all(action='SELECT');root.select_set(True);obj.select_set(True)
for name in ['ANCHOR_LABEL','ANCHOR_STATUS']:bpy.data.objects[name].select_set(True)
bpy.context.view_layer.objects.active=root
folder=os.path.dirname(os.path.abspath(__file__))
bpy.ops.export_scene.gltf(filepath=os.path.join(folder,'terrain.glb'),export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_colors=True,export_materials='EXPORT')
manifest={'source':'source.py','blender':'4.2+','envelope_xz_m':[160,120],'center_flat_x_m':[-35,35],'center_flat_z_m':[-21.5,21.5],'triangles_source':len(faces),'materials':['TERRAIN_GROUND'],'anchors':{'ANCHOR_LABEL':[0,4.2,0],'ANCHOR_STATUS':[32,.35,19]},'note':'Check exported GLB externally; source geometry count is not post-export measured.'}
with open(os.path.join(folder,'source_manifest.json'),'w') as f:json.dump(manifest,f,indent=2)
