import {Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList} from "@/components/ui/combobox";
import {toast} from "sonner";
import {useSearchParams} from "react-router-dom";
import {Pause, Play, RefreshCw, Upload} from "lucide-react";
import {Canvas, useFrame, useThree} from "@react-three/fiber";
import {OrbitControls, useGLTF, useProgress} from "@react-three/drei";
import React, {Suspense, useRef, useEffect, useState, useMemo, useCallback} from "react";
import * as THREE from "three";
import {clone} from "three/examples/jsm/utils/SkeletonUtils.js";

import {type SkinObject, SkinTypes, SkinOrders} from "@/types/Skin.ts";
import {type ModelObject, ModelTypes, ModelOrders} from "@/types/Model.ts";
import InventoryItem from "@/components/custom/InventoryItem.tsx";
import {useLayoutTopbar} from "@/components/custom/LayoutTopbar.tsx";
import Config from "../../vite.app.config.js";

type ViewableModelProps = {
    ModelPath: string;
    Path: File | string;
    IsRotating: boolean;
    OnModelReady: (ModelPath: string) => void;
    OnSkinLoadChange: (State: ViewerLoadState) => void;
};

type VideoFrameElement = HTMLVideoElement & {
    requestVideoFrameCallback?: (Callback: () => void) => number;
    cancelVideoFrameCallback?: (Handle: number) => void;
};

type ViewerLoadState = {
    IsActive: boolean;
    Progress: number;
    Label: string;
    Detail?: string;
};

type ApiResponse<T> = {
    data?: T[];
};

const EmptyLoadState: ViewerLoadState = {
    IsActive: false,
    Progress: 0,
    Label: "",
};

const PreloadedModelPaths = new Set<string>();
const PreloadedTexturePaths = new Set<string>();

const ClampProgress = (Progress: number) => Math.max(0, Math.min(100, Math.round(Progress)));

const FormatAssetName = (Path: string) => {
    const CleanPath = Path.split("?")[0];
    const Segments = CleanPath.split("/");
    return decodeURIComponent(Segments[Segments.length - 1] || CleanPath);
};

const PreloadModel = (ModelPath: string) => {
    if (!ModelPath || PreloadedModelPaths.has(ModelPath)) return;

    PreloadedModelPaths.add(ModelPath);
    useGLTF.preload(ModelPath);
};

const PreloadTexture = (Path: File | string) => {
    if (Path instanceof File || !Path || PreloadedTexturePaths.has(Path)) return;

    PreloadedTexturePaths.add(Path);

    const Link = document.createElement("link");
    Link.rel = "preload";
    Link.as = "video";
    Link.href = Path;
    Link.crossOrigin = "anonymous";
    Link.setAttribute("fetchpriority", "high");
    document.head.appendChild(Link);
};

const FetchApiData = async <T,>(Path: string, signal: AbortSignal): Promise<ApiResponse<T>> => {
    const Response = await fetch(`${Config.API_URL}${Path}`, {signal});

    if (!Response.ok) {
        throw new Error(`Request failed with status ${Response.status}`);
    };

    return Response.json() as Promise<ApiResponse<T>>;
};

function ViewerLoadingScreen({State}: {State: ViewerLoadState}) {
    if (!State.IsActive) return null;

    const Progress = ClampProgress(State.Progress);

    return (
        <div className="absolute inset-0 z-40 flex items-center justify-center overflow-hidden bg-zinc-950/80 backdrop-blur-sm">
            <div className="flex w-full max-w-sm flex-col items-center px-6 text-center">
                <div className="relative flex h-20 w-20 items-center justify-center">
                    <div className="absolute inset-1 rounded-full border-2 border-zinc-700 border-t-lime-400 animate-spin" />
                    <RefreshCw className="h-6 w-6 animate-spin text-lime-300" />
                </div>

                <p className="mt-6 text-base font-medium text-zinc-100">{State.Label}</p>

                <div className="mt-5 w-full bg-zinc-800/30 rounded-md border border-zinc-800 p-3">
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                        <span>Preparing</span>
                        <span className="tabular-nums">{Progress}%</span>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
                        <div className="h-full rounded-full bg-lime-400 shadow-[0_0_18px_rgba(163,230,53,0.45)] transition-[width] duration-200 ease-out" style={{width: `${Progress}%`}} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const ViewableModel = React.memo(function ViewableModel({ModelPath, Path, IsRotating, OnModelReady, OnSkinLoadChange}: ViewableModelProps) {
    const GLTF = useGLTF(ModelPath);
    const Scene = useMemo(() => clone(GLTF.scene) as THREE.Group, [GLTF.scene]);
    const Group = useRef<THREE.Group>(null);
    const Controls = useRef<React.ElementRef<typeof OrbitControls>>(null);
    const Video = useRef<HTMLVideoElement | null>(null);
    const Materials = useRef<{
        Material: THREE.MeshBasicMaterial;
        Texture: THREE.VideoTexture;
        OriginalMaterials: Map<THREE.Mesh, THREE.Material | THREE.Material[]>;
        IsApplied: boolean;
    } | null>(null);
    const {camera, invalidate} = useThree();

    useEffect(() => {
        OnModelReady(ModelPath);
    }, [ModelPath, OnModelReady]);

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
        Texture.generateMipmaps = false;
        Texture.magFilter = THREE.LinearFilter;
        Texture.minFilter = THREE.LinearFilter;
        Texture.wrapS = THREE.RepeatWrapping;
        Texture.wrapT = THREE.RepeatWrapping;

        const CurrentMaterials = {
            Material: new THREE.MeshBasicMaterial({map: Texture, toneMapped: false}),
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
        let IsTextureReady = false;
        let VideoFrame: number | null = null;
        let AnimationFrame: number | null = null;
        const TextureDetail = Path instanceof File ? Path.name : FormatAssetName(Path);

        const ReportProgress = (Progress: number, Label: string, IsActive = true) => {
            if (IsCancelled) return;

            OnSkinLoadChange({
                IsActive,
                Progress: ClampProgress(Progress),
                Label,
                Detail: TextureDetail,
            });
        };

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

        const HandleLoadStart = () => ReportProgress(12, "Loading skin texture");
        const HandleLoadedMetadata = () => ReportProgress(40, "Reading skin texture");
        const HandleWaiting = () => {
            if (!IsTextureReady) ReportProgress(82, "Buffering skin texture");
        };
        const HandleError = () => {
            ReportProgress(0, "Skin texture failed", false);
            toast.error("Unable to load that skin texture.");
        };

        const HandleTextureReady = () => {
            if (IsCancelled || IsTextureReady) return;

            IsTextureReady = true;
            ApplyMaterial();
            CurrentVideo.play().catch(() => {});
            StopFrames();
            QueueFrame();
            ReportProgress(100, "Skin texture ready", false);
        };

        ReportProgress(5, "Queueing skin texture");
        CurrentVideo.addEventListener("loadstart", HandleLoadStart);
        CurrentVideo.addEventListener("loadedmetadata", HandleLoadedMetadata);
        CurrentVideo.addEventListener("loadeddata", HandleTextureReady);
        CurrentVideo.addEventListener("waiting", HandleWaiting);
        CurrentVideo.addEventListener("stalled", HandleWaiting);
        CurrentVideo.addEventListener("error", HandleError);
        CurrentVideo.addEventListener("canplay", HandleTextureReady);
        CurrentVideo.addEventListener("playing", HandleTextureReady);

        if (Path instanceof File) {
            ObjectURL = URL.createObjectURL(Path);
            CurrentVideo.src = ObjectURL;
        } else {
            CurrentVideo.src = Path;
        };

        CurrentVideo.load();

        if (CurrentVideo.readyState >= 2) {
            HandleTextureReady();
        };

        return () => {
            IsCancelled = true;
            CurrentVideo.removeEventListener("loadstart", HandleLoadStart);
            CurrentVideo.removeEventListener("loadedmetadata", HandleLoadedMetadata);
            CurrentVideo.removeEventListener("loadeddata", HandleTextureReady);
            CurrentVideo.removeEventListener("waiting", HandleWaiting);
            CurrentVideo.removeEventListener("stalled", HandleWaiting);
            CurrentVideo.removeEventListener("error", HandleError);
            CurrentVideo.removeEventListener("canplay", HandleTextureReady);
            CurrentVideo.removeEventListener("playing", HandleTextureReady);
            StopFrames();
            CurrentVideo.pause();

            if (ObjectURL) {
                URL.revokeObjectURL(ObjectURL);
            };
        };
    }, [Path, Scene, OnSkinLoadChange, invalidate]);

    return (
        <>
            <primitive ref={Group} object={Scene} dispose={null} />
            <OrbitControls ref={Controls} enableZoom enablePan={false} onChange={() => invalidate()} />
        </>
    );
});

export default function Page() {
    const [SearchParams, setSearchParams] = useSearchParams();
    const ModelLoadProgress = useProgress();
    const [Loading, setLoading] = useState(true);
    const [Skins, setSkins] = useState<SkinObject[]>([]);
    const [Models, setModels] = useState<ModelObject[]>([]);
    const [SelectedSkin, setSelectedSkin] = useState<SkinObject | null>(null);
    const [SelectedModel, setSelectedModel] = useState<ModelObject | null>(null);
    const [CustomFile, setCustomFile] = useState<File | null>(null);
    const [PendingModelPath, setPendingModelPath] = useState<string | null>(null);
    const [SkinLoadState, setSkinLoadState] = useState<ViewerLoadState>(EmptyLoadState);
    const [Rotating, setRotating] = useState(true);

    useEffect(() => {
        const Controller = new AbortController();
        let RetryTimer: ReturnType<typeof setTimeout> | null = null;

        const FetchData = async () => {
            try {
                const [SkinsJson, ModelsJson] = await Promise.all([
                    FetchApiData<SkinObject>("/skins", Controller.signal),
                    FetchApiData<ModelObject>("/models", Controller.signal),
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
                if (Controller.signal.aborted) return;

                setLoading(true);
                RetryTimer = window.setTimeout(FetchData, 5000);
            };
        };

        FetchData();

        return () => {
            Controller.abort();
            if (RetryTimer) window.clearTimeout(RetryTimer);
        };
    }, []);

    useEffect(() => {
        if (!Skins.length) return;

        const SkinParameter = SearchParams.get("skin");
        const NextSkin = Skins.find((Skin) => Skin.name === SkinParameter) || Skins[0];

        PreloadTexture(NextSkin.texture_url);
        setSelectedSkin(NextSkin);
    }, [Skins, SearchParams]);

    useEffect(() => {
        if (!Models.length) return;

        const ModelParameter = SearchParams.get("model");
        const NextModel = Models.find((Model) => Model.name === ModelParameter) || Models[0];
        if (SelectedModel?.model_url === NextModel.model_url) return;

        PreloadModel(NextModel.model_url);
        setPendingModelPath(NextModel.model_url);
        setSelectedModel(NextModel);
    }, [Models, SearchParams, SelectedModel?.model_url]);

    useEffect(() => {
        if (!SelectedSkin) return;

        const TexturePath = CustomFile || SelectedSkin.texture_url;

        PreloadTexture(TexturePath);
        setSkinLoadState({
            IsActive: true,
            Progress: 5,
            Label: "Queueing skin texture",
            Detail: TexturePath instanceof File ? TexturePath.name : FormatAssetName(TexturePath),
        });
    }, [CustomFile, SelectedSkin]);

    const HandleModelReady = useCallback((ModelPath: string) => {
        setPendingModelPath((CurrentPath) => CurrentPath === ModelPath ? null : CurrentPath);
    }, []);

    const HandleSkinLoadChange = useCallback((State: ViewerLoadState) => {
        setSkinLoadState(State);
    }, []);

    const HandleSkinChange = useCallback((Value: unknown) => {
        if (typeof Value !== "string") return;

        const Skin = Skins.find((Skin) => Skin.name === Value);
        if (!Skin) return;
        if (!CustomFile && SelectedSkin?.texture_url === Skin.texture_url) return;

        PreloadTexture(Skin.texture_url);
        setSkinLoadState({
            IsActive: true,
            Progress: 5,
            Label: "Queueing skin texture",
            Detail: FormatAssetName(Skin.texture_url),
        });
        setSelectedSkin(Skin);
        setCustomFile(null);
        setSearchParams(Previous => {
            const Parameters = new URLSearchParams(Previous);
            Parameters.set("skin", Skin.name);
            return Parameters;
        });
    }, [CustomFile, SelectedSkin?.texture_url, Skins, setSearchParams]);

    const HandleModelChange = useCallback((Value: unknown) => {
        if (typeof Value !== "string") return;

        const Model = Models.find((Model) => Model.name === Value);
        if (!Model) return;
        if (SelectedModel?.model_url === Model.model_url) return;

        PreloadModel(Model.model_url);
        setPendingModelPath(Model.model_url);
        setSelectedModel(Model);
        setSearchParams(Previous => {
            const Parameters = new URLSearchParams(Previous);
            Parameters.set("model", Model.name);
            return Parameters;
        });
    }, [Models, SelectedModel?.model_url, setSearchParams]);

    const HandleUpload = useCallback((Interaction: React.ChangeEvent<HTMLInputElement>) => {
        const File = Interaction.target.files?.[0];
        
        if (!File) {
            toast.error("That file does not exist.");
            Interaction.target.value = "";
            return;
        };

        const IsFileTypeMP4 = File.type === "video/mp4";
        const IsFileAMP4 = File.name.toLowerCase().endsWith(".mp4");

        if (!IsFileTypeMP4 && !IsFileAMP4) {
            toast.error("Only MP4 file types are allowed.");
            Interaction.target.value = "";
            return;
        };

        if (File.size > 50 * 1024 * 1024) {
            toast.error("Uploaded files must be under 50 megabytes.");
            Interaction.target.value = "";
            return;
        };

        toast.success("Successfully loaded the provided mp4.");
        setSkinLoadState({
            IsActive: true,
            Progress: 5,
            Label: "Queueing skin texture",
            Detail: File.name,
        });
        setCustomFile(File);
        Interaction.target.value = "";
    }, []);

    const CurrentLoadState = useMemo<ViewerLoadState>(() => {
        if (Loading) {
            return {
                IsActive: true,
                Progress: 18,
                Label: "Loading viewer data",
                Detail: "Skins and models",
            };
        };

        if (!SelectedModel || !SelectedSkin) {
            return {
                IsActive: true,
                Progress: 35,
                Label: "Preparing viewer",
            };
        };

        if (PendingModelPath === SelectedModel.model_url) {
            const IsSelectedModelLoading = ModelLoadProgress.active && ModelLoadProgress.item === SelectedModel.model_url;

            return {
                IsActive: true,
                Progress: IsSelectedModelLoading ? Math.min(ModelLoadProgress.progress, 96) : 18,
                Label: "Loading 3D model",
                Detail: SelectedModel.name,
            };
        };

        if (SkinLoadState.IsActive) {
            return SkinLoadState;
        };

        return EmptyLoadState;
    }, [Loading, ModelLoadProgress.active, ModelLoadProgress.item, ModelLoadProgress.progress, PendingModelPath, SelectedModel, SelectedSkin, SkinLoadState]);

    const TopbarContent = useMemo(() => {
        if (Loading) return null;

        return (
            <>
                <div className="relative z-35 ml-1 w-full sm:w-60">
                    <Combobox items={Skins} value={SelectedSkin?.name || ""} onValueChange={HandleSkinChange}>
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
                    <Combobox items={Models} value={SelectedModel?.name || ""} onValueChange={HandleModelChange}>
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

                <label aria-label="Upload MP4 skin" title="Upload MP4 skin" className="flex gap-2 justify-between items-center px-3 py-1 h-10.5 hover:cursor-pointer hover:border-zinc-600 rounded-md bg-zinc-800 border border-zinc-700 text-white hover:bg-zinc-700 transition">
                    <Upload className="h-5 w-5" />
                    <input type="file" accept="video/mp4" className="hidden" onChange={HandleUpload} />
                </label>

                <div className="flex gap-2 justify-between items-center">
                    <button aria-label={Rotating ? "Pause rotation" : "Play rotation"} title={Rotating ? "Pause rotation" : "Play rotation"} onClick={() => setRotating((Boolean) => !Boolean)} className="px-3 py-1 h-10.5 hover:border-zinc-600 hover:cursor-pointer rounded-md bg-zinc-800 border border-zinc-700 text-white hover:bg-zinc-700 transition">
                        {Rotating ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </button>
                </div>
            </>
        );
    }, [HandleModelChange, HandleSkinChange, HandleUpload, Loading, Models, Rotating, SelectedModel?.name, SelectedSkin?.name, Skins]);

    useLayoutTopbar(TopbarContent, CurrentLoadState.IsActive);

    return (
        <>
            <div className="relative flex min-h-0 flex-1 overflow-hidden">
                <div className={`absolute inset-0 transition-opacity duration-300 ${CurrentLoadState.IsActive ? "pointer-events-none opacity-0" : "opacity-100"}`}>
                    {!CurrentLoadState.IsActive && SelectedModel?.class_name && (
                        <div className="absolute bottom-3 left-3 z-40">
                            <InventoryItem key={SelectedModel.id} path={SelectedModel.type === 1 ? "weapons" : "suits"} weapon={SelectedModel.class_name || ""} skin={SelectedSkin?.image_url} rarity="common"/>
                        </div>
                    )}

                    {SelectedModel && SelectedSkin && (
                        <Canvas camera={{fov: 40}} frameloop="demand" className="h-full w-full">
                            <ambientLight intensity={0.6} />
                            <directionalLight position={[5, 5, 5]} />
                            <Suspense fallback={null}>
                                <ViewableModel ModelPath={SelectedModel.model_url} Path={CustomFile || SelectedSkin.texture_url} IsRotating={Rotating} OnModelReady={HandleModelReady} OnSkinLoadChange={HandleSkinLoadChange}/>
                            </Suspense>
                        </Canvas>
                    )}
                </div>

                {CurrentLoadState.IsActive && (
                    <div className="absolute inset-0">
                        <ViewerLoadingScreen State={CurrentLoadState} />
                    </div>
                )}
            </div>

            {!CurrentLoadState.IsActive && (
                <div className="border-t border-zinc-800 bg-zinc-950 p-3 rounded-b-lg">
                    <div className="h-10" />
                </div>
            )}
        </>
    );
};
