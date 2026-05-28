import {Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList} from "@/components/ui/combobox";
import {toast} from "sonner";
import {useSearchParams} from "react-router-dom";
import {Pause, Play, RefreshCw, Upload} from "lucide-react";
import {Canvas, useFrame, useThree} from "@react-three/fiber";
import {OrbitControls, useGLTF} from "@react-three/drei";
import React, {Suspense, useRef, useEffect, useState, useMemo, useCallback} from "react";
import * as THREE from "three";
import {clone} from "three/examples/jsm/utils/SkeletonUtils.js";

import {type SkinObject, SkinTypes, SkinOrders} from "@/types/Skin.ts";
import {type ModelObject, ModelTypes, ModelOrders} from "@/types/Model.ts";
import InventoryItem from "@/components/custom/InventoryItem.tsx";
import {useLayoutTopbar} from "@/components/custom/LayoutTopbar.tsx";

type ViewableModelProps = {
    ModelPath: string;
    Path: File | string;
    IsRotating: boolean;
};

type VideoFrameElement = HTMLVideoElement & {
    requestVideoFrameCallback?: (Callback: () => void) => number;
    cancelVideoFrameCallback?: (Handle: number) => void;
};

const ViewableModel = React.memo(function ViewableModel({ModelPath, Path, IsRotating}: ViewableModelProps) {
    const GLTF = useGLTF(ModelPath);
    const Scene = useMemo(() => clone(GLTF.scene) as THREE.Group, [GLTF.scene]);
    const Group = useRef<THREE.Group>(null);
    const Controls = useRef<any>(null);
    const Video = useRef<HTMLVideoElement | null>(null);
    const Materials = useRef<{
        Material: THREE.MeshBasicMaterial;
        Texture: THREE.VideoTexture;
        OriginalMaterials: Map<THREE.Mesh, THREE.Material | THREE.Material[]>;
        IsApplied: boolean;
    } | null>(null);
    const {camera, invalidate} = useThree();

    useFrame((_, Delta) => {
        if (IsRotating && Group.current) {
            Group.current.rotation.y += Delta * 0.7;
        };
    });

    useEffect(() => {
        if (!IsRotating) return;

        let AnimationFrame = 0;

        const Render = () => {
            invalidate();
            AnimationFrame = window.requestAnimationFrame(Render);
        };

        Render();

        return () => {
            window.cancelAnimationFrame(AnimationFrame);
        };
    }, [IsRotating, invalidate]);

    useEffect(() => {
        Scene.position.set(0, 0, 0);

        const Box = new THREE.Box3().setFromObject(Scene);
        if (Box.isEmpty()) return;

        const Center = Box.getCenter(new THREE.Vector3());
        const Size = Box.getSize(new THREE.Vector3());

        Scene.position.set(-Center.x, -Box.min.y, -Center.z);

        const MaxDim = Math.max(Size.x, Size.y, Size.z);
        camera.position.set(0, Size.y * 0.5, MaxDim * 2);
        camera.lookAt(0, Size.y * 0.5, 0);

        Controls.current?.target.set(0, Size.y * 0.5, 0);
        Controls.current?.update();
        invalidate();
    }, [Scene, camera, invalidate]);

    useEffect(() => {
        const CurrentVideo = document.createElement("video");
        CurrentVideo.loop = true;
        CurrentVideo.muted = true;
        CurrentVideo.playsInline = true;
        CurrentVideo.crossOrigin = "anonymous";
        CurrentVideo.preload = "auto";

        const Texture = new THREE.VideoTexture(CurrentVideo);
        Texture.colorSpace = THREE.SRGBColorSpace;
        Texture.flipY = false;
        Texture.wrapS = THREE.RepeatWrapping;
        Texture.wrapT = THREE.RepeatWrapping;

        const CurrentMaterials = {
            Material: new THREE.MeshBasicMaterial({map: Texture}),
            Texture,
            OriginalMaterials: new Map<THREE.Mesh, THREE.Material | THREE.Material[]>(),
            IsApplied: false,
        };

        Video.current = CurrentVideo;
        Materials.current = CurrentMaterials;

        return () => {
            CurrentVideo.pause();
            CurrentVideo.removeAttribute("src");
            CurrentVideo.load();

            CurrentMaterials.OriginalMaterials.forEach((OriginalMaterial, Mesh) => {
                Mesh.material = OriginalMaterial;
            });

            CurrentMaterials.Material.dispose();
            CurrentMaterials.Texture.dispose();

            if (Video.current === CurrentVideo) {
                Video.current = null;
            };

            if (Materials.current === CurrentMaterials) {
                Materials.current = null;
            };
        };
    }, [Scene]);

    useEffect(() => {
        const CurrentVideo = Video.current as VideoFrameElement | null;
        if (!CurrentVideo) return;

        let ObjectURL: string | null = null;
        let IsCancelled = false;
        let VideoFrame: number | null = null;
        let AnimationFrame: number | null = null;

        const StopFrames = () => {
            if (VideoFrame !== null && CurrentVideo.cancelVideoFrameCallback) {
                CurrentVideo.cancelVideoFrameCallback(VideoFrame);
                VideoFrame = null;
            };

            if (AnimationFrame !== null) {
                window.cancelAnimationFrame(AnimationFrame);
                AnimationFrame = null;
            };
        };

        const QueueFrame = () => {
            if (IsCancelled) return;

            invalidate();

            if (CurrentVideo.requestVideoFrameCallback) {
                VideoFrame = CurrentVideo.requestVideoFrameCallback(QueueFrame);
            } else {
                AnimationFrame = window.requestAnimationFrame(QueueFrame);
            };
        };

        const ApplyMaterial = () => {
            const CurrentMaterials = Materials.current;
            if (!CurrentMaterials || CurrentMaterials.IsApplied) return;

            Scene.traverse((Object) => {
                const Mesh = Object as THREE.Mesh;

                if (Mesh.isMesh) {
                    CurrentMaterials.OriginalMaterials.set(Mesh, Mesh.material);
                    Mesh.material = CurrentMaterials.Material;
                };
            });

            CurrentMaterials.IsApplied = true;
        };

        const HandleCanPlay = () => {
            ApplyMaterial();
            CurrentVideo.play().catch(() => {});
            StopFrames();
            QueueFrame();

            if (ObjectURL) {
                URL.revokeObjectURL(ObjectURL);
                ObjectURL = null;
            };
        };

        CurrentVideo.addEventListener("canplay", HandleCanPlay);

        if (Path instanceof File) {
            ObjectURL = URL.createObjectURL(Path);
            CurrentVideo.src = ObjectURL;
        } else {
            CurrentVideo.src = Path;
        };

        CurrentVideo.load();

        if (CurrentVideo.readyState >= 3) {
            HandleCanPlay();
        };

        return () => {
            IsCancelled = true;
            CurrentVideo.removeEventListener("canplay", HandleCanPlay);
            StopFrames();
            CurrentVideo.pause();

            if (ObjectURL) {
                URL.revokeObjectURL(ObjectURL);
            };
        };
    }, [Path, Scene, invalidate]);

    return (
        <>
            <primitive ref={Group} object={Scene} dispose={null} />
            <OrbitControls ref={Controls} enableZoom enablePan={false} onChange={() => invalidate()} />
        </>
    );
});

export default function Page() {
    const [SearchParams, setSearchParams] = useSearchParams();
    const [Loading, setLoading] = useState(true);
    const [Skins, setSkins] = useState<SkinObject[]>([]);
    const [Models, setModels] = useState<ModelObject[]>([]);
    const [SelectedSkin, setSelectedSkin] = useState<SkinObject | null>(null);
    const [SelectedModel, setSelectedModel] = useState<ModelObject | null>(null);
    const [CustomFile, setCustomFile] = useState<File | null>(null);
    const [Rotating, setRotating] = useState(true);

    useEffect(() => {
        let RetryTimer: ReturnType<typeof setTimeout>;

        const FetchData = async () => {
            try {
                const [SkinsResponse, ModelsResponse] = await Promise.all([
                    fetch(`/api/skins`),
                    fetch(`/api/models`)
                ]);

                const [SkinsJson, ModelsJson] = await Promise.all([
                    SkinsResponse.json(),
                    ModelsResponse.json()
                ]);

                const SkinsData = (SkinsJson.data || [])
                .map((Item: SkinObject) => ({
                    id: Item.id,
                    name: Item.name,
                    internal_id: Item.internal_id,
                    steam_id: Item.steam_id,
                    discord_id: Item.discord_id,
                    image_url: Item.image_url,
                    texture_url: Item.texture_url,
                    type: Item.type,
                })).sort((A: SkinObject, B: SkinObject) => SkinOrders[A.type] - SkinOrders[B.type]);

                const ModelsData = (ModelsJson.data || [])
                .map((Item: ModelObject) => ({
                    id: Item.id,
                    name: Item.name,
                    model_url: Item.model_url,
                    class_name: Item.class_name,
                    type: Item.type,
                })).sort((A: ModelObject, B: ModelObject) => ModelOrders[A.type] - ModelOrders[B.type]);

                setSkins(SkinsData);
                setModels(ModelsData);
                setLoading(false);
            } catch {
                setLoading(true);
                RetryTimer = setTimeout(FetchData, 5000);
            };
        };

        FetchData();

        return () => {
            if (RetryTimer) clearTimeout(RetryTimer);
        };
    }, []);

    useEffect(() => {
        if (!Skins.length) return;
        const SkinParameter = SearchParams.get("skin");
        const ResultsFound = Skins.find((Skin) => Skin.name === SkinParameter);
        setSelectedSkin(ResultsFound || Skins[0]);
    }, [Skins, SearchParams]);

    useEffect(() => {
        if (!Models.length) return;
        const ModelParameter = SearchParams.get("model");
        const ResultsFound = Models.find((Model) => Model.name === ModelParameter);
        setSelectedModel(ResultsFound || Models[0]);
    }, [Models, SearchParams]);

    const HandleUpload = useCallback((Interaction: React.ChangeEvent<HTMLInputElement>) => {
        const File = Interaction.target.files?.[0];
        
        if (!File) {
            toast.error("That file does not exist.")
            Interaction.target.value = "";
            return;
        };

        const IsFileTypeMP4 = File.type === "video/mp4";
        const IsFileAMP4 = File.name.toLowerCase().endsWith(".mp4");

        if (!IsFileTypeMP4 && !IsFileAMP4) {
            toast.error("Only MP4 file types are allowed.")
            Interaction.target.value = "";
            return;
        };

        if (File.size > 50 * 1024 * 1024) {
            toast.error("Uploaded files must be under 50 megabytes.")
            Interaction.target.value = "";
            return;
        };

        toast.success("Successfully loaded the provided mp4.")
        setCustomFile(File);
    }, []);

    const TopbarContent = useMemo(() => {
        if (Loading) return null;

        return (
            <>
                <div className="relative z-35 ml-1 w-full sm:w-60">
                    <Combobox items={Skins} value={SelectedSkin?.name || ""} onValueChange={(Value: any) => {const Skin = Skins.find((Skin) => Skin.name === Value); if (!Skin) return; setSelectedSkin(Skin); setCustomFile(null); setSearchParams(Previous => {const Parameters = new URLSearchParams(Previous); Parameters.set("skin", Skin.name); return Parameters})}}>
                        <ComboboxInput placeholder="Select a skin!" className={"h-full rounded-sm data-selected:focus:ring-0 hover:border-zinc-600 transition bg-zinc-800 border border-zinc-700 text-white [&_svg]:text-zinc-400"}/>
                        <ComboboxContent className="my-2 bg-zinc-900 border border-zinc-700 rounded-sm z-50 text-gray-200">
                            <ComboboxEmpty>No items found.</ComboboxEmpty>
                            <ComboboxList>
                                {(Item : SkinObject) => (
                                    <ComboboxItem key={Item.internal_id} value={Item.name} className={"cursor-pointer w-full text-left px-3 py-2 text-white hover:bg-zinc-800 data-selected:bg-zinc-800 data-highlighted:bg-zinc-800 rounded-sm data-highlighted:text-gray-300"}>
                                        [{`${SkinTypes[Item.type]}`}] {Item.name}
                                    </ComboboxItem>
                                )}
                            </ComboboxList>
                        </ComboboxContent>
                    </Combobox>
                </div>

                <div className="relative z-35 w-full sm:w-60">
                    <Combobox items={Models} value={SelectedModel?.name || ""} onValueChange={(Value: any) => {const Model = Models.find((Model) => Model.name === Value); if (!Model) return; setSelectedModel(Model); setSearchParams(Previous => {const Parameters = new URLSearchParams(Previous); Parameters.set("model", Model.name); return Parameters})}}>
                        <ComboboxInput placeholder="Select a model!" className={"h-full rounded-sm data-selected:focus:ring-0 hover:border-zinc-600 transition bg-zinc-800 border border-zinc-700 text-white [&_svg]:text-zinc-400"}/>
                        <ComboboxContent className="my-2 bg-zinc-900 border border-zinc-700 rounded-sm z-50 text-gray-200">
                            <ComboboxEmpty>No items found.</ComboboxEmpty>
                            <ComboboxList>
                                {(Item : ModelObject) => (
                                    <ComboboxItem key={Item.id} value={Item.name} className={"cursor-pointer w-full text-left px-3 py-2 text-white hover:bg-zinc-800 data-selected:bg-zinc-800 data-highlighted:bg-zinc-800 rounded-sm data-highlighted:text-gray-300"}>
                                        [{`${ModelTypes[Item.type]}`}] {Item.name}
                                    </ComboboxItem>
                                )}
                            </ComboboxList>
                        </ComboboxContent>
                    </Combobox>
                </div>

                <label className="flex gap-2 justify-between items-center px-3 py-1 h-10.5 hover:cursor-pointer hover:border-zinc-600 rounded-md bg-zinc-800 border border-zinc-700 text-white hover:bg-zinc-700 transition">
                    <Upload className="h-5 w-5" />
                    <input type="file" accept="video/mp4" className="hidden" onChange={HandleUpload} />
                </label>

                <div className="flex gap-2 justify-between items-center">
                    <button onClick={() => setRotating((Boolean) => !Boolean)} className="px-3 py-1 h-10.5 hover:border-zinc-600 hover:cursor-pointer rounded-md bg-zinc-800 border border-zinc-700 text-white hover:bg-zinc-700 transition">
                        {Rotating ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </button>
                </div>
            </>
        );
    }, [HandleUpload, Loading, Models, Rotating, SelectedModel?.name, SelectedSkin?.name, Skins, setSearchParams]);

    useLayoutTopbar(TopbarContent);

    return (
        <>
            {Loading ? (
                <div className="flex flex-1 items-center justify-center">
                    <RefreshCw className="animate-spin h-24 w-24 text-zinc-300"/>
                </div>
            ) : (
                <>
                    <div className="flex-1 overflow-y-auto p-3 relative">
                        {SelectedModel?.class_name && (
                            <div className="absolute bottom-3 left-3 z-40">
                                <InventoryItem key={SelectedModel.id} path={SelectedModel.type === 1 ? "weapons" : "suits"} weapon={SelectedModel.class_name || ""} skin={SelectedSkin?.image_url} rarity="common"/>
                            </div>
                        )}

                        <Canvas camera={{fov: 40}} frameloop="demand" className="w-full h-full">
                            <ambientLight intensity={0.6} />
                            <directionalLight position={[5, 5, 5]} />
                            <Suspense fallback={null}>
                                {SelectedModel && SelectedSkin && <ViewableModel ModelPath={SelectedModel.model_url} Path={CustomFile || SelectedSkin.texture_url} IsRotating={Rotating}/>}
                            </Suspense>
                        </Canvas>
                    </div>

                    <div className="border-t border-zinc-800 bg-zinc-950 p-3 rounded-b-lg">
                        <div className="flex gap-2 justify-between h-10"></div>
                    </div>
                </>
            )}
        </>
    );
};
