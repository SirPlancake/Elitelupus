import * as React from "react";
import * as ReactRouter from "react-router-dom";
import * as Lucide from "lucide-react";
import * as ReactThreeFiber from "@react-three/fiber";
import * as ReactThreeDrei from "@react-three/drei";
import * as Three from "three";
import * as SkeletonUtil from "three/examples/jsm/utils/SkeletonUtils.js";

import * as ModelsData from "@/data/ModelsData.ts";
import * as SkinsData from "@/data/SkinsData.ts";
import * as RarityData from "@/data/RarityData.ts";
import * as ModelsType from "@/types/ModelsType.tsx";
import * as SkinsType from "@/types/SkinsType.tsx";
import type {LayoutOutletContext} from "@/Layout.tsx";

type ViewerLoadState = {
    Active: boolean;
    Label: string;
    Detail?: string;
};

type TextureSourceKind = "gif" | "video";

type ViewableModelProps = {
    ModelPath: string;
    TexturePath: File | string;
    Rotating: boolean;
    OnModelReady: (ModelPath: string) => void;
    OnTextureLoadChange: (State: ViewerLoadState) => void;
};

type ViewerSelectBadge = {
    Label: string;
    ClassName: string;
};

type ViewerSelectProps<T> = {
    Icon: React.ReactNode;
    Items: T[];
    SelectedItem: T | null;
    Placeholder: string;
    GetKey: (Item: T) => string;
    GetLabel: (Item: T) => string;
    GetMeta: (Item: T) => string;
    GetBadge?: (Item: T) => ViewerSelectBadge;
    OnSelect: (Item: T) => void;
};

const EmptyLoadState: ViewerLoadState = {
    Active: false,
    Label: "",
};

const ModelTypeLabels: Record<ModelsType.ModelType, string> = {
    [ModelsType.ModelType.SUIT]: "Suit",
    [ModelsType.ModelType.WEAPON]: "Weapon",
};

const PreloadedModelPaths = new Set<string>();
const PreloadedTexturePaths = new Set<string>();
const TopbarButtonClassName = "grid h-12 min-h-12 w-13 min-w-12 shrink-0 cursor-pointer place-items-center rounded-md border border-zinc-800 bg-zinc-900 p-0 text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900/90 hover:text-white disabled:cursor-not-allowed disabled:opacity-40";

function GetRarity(Type: SkinsType.SkinsRarity) {
    return RarityData.RarityStyles.find((Rarity) => Rarity.value === Type) ?? RarityData.RarityStyles[RarityData.RarityStyles.length - 1];
};

function GetModelPath(Model: ModelsType.ModelObject) {
    return `/models${Model.file_path}`;
};

function GetSkinPath(Skin: SkinsType.SkinsObject) {
    if (Skin.file_path.startsWith("blob:") || Skin.file_path.startsWith("/")) {
        return Skin.file_path;
    };

    return `/images/skins/${Skin.file_path}`;
};

function FormatAssetName(Path: File | string) {
    if (Path instanceof File) {
        return Path.name;
    };

    const CleanPath = Path.split("?")[0];
    const Segments = CleanPath.split("/");
    return decodeURIComponent(Segments[Segments.length - 1] || CleanPath);
};

function GetTextureSourceKind(Path: File | string): TextureSourceKind {
    const Type = Path instanceof File ? Path.type.toLowerCase() : "";
    const Name = Path instanceof File ? Path.name : Path.split("?")[0];

    if (Type === "image/gif" || Name.toLowerCase().endsWith(".gif")) {
        return "gif";
    };

    return "video";
};

function PreloadModel(ModelPath: string) {
    if (!ModelPath || PreloadedModelPaths.has(ModelPath)) return;

    PreloadedModelPaths.add(ModelPath);
    ReactThreeDrei.useGLTF.preload(ModelPath);
};

function PreloadTexture(TexturePath: File | string) {
    if (TexturePath instanceof File || !TexturePath || PreloadedTexturePaths.has(TexturePath)) return;

    PreloadedTexturePaths.add(TexturePath);

    const Link = document.createElement("link");
    Link.rel = "preload";
    Link.as = GetTextureSourceKind(TexturePath) === "gif" ? "image" : "video";
    Link.href = TexturePath;
    Link.crossOrigin = "anonymous";
    Link.setAttribute("fetchpriority", "high");
    document.head.appendChild(Link);
};

function FindModelByName(Models: ModelsType.ModelObject[], Name: string | null) {
    return Models.find((Model) => Model.name === Name) ?? Models[0] ?? null;
};

function FindSkinByName(Skins: SkinsType.SkinsObject[], Name: string | null) {
    return Skins.find((Skin) => Skin.name === Name) ?? Skins[0] ?? null;
};

function ViewerSelect<T>({Icon, Items, SelectedItem, Placeholder, GetKey, GetLabel, GetMeta, GetBadge, OnSelect}: ViewerSelectProps<T>) {
    const [Open, SetOpen] = React.useState(false);
    const [Query, SetQuery] = React.useState("");
    const DropdownRef = React.useRef<HTMLDivElement | null>(null);
    const QueryText = Query.trim().toLowerCase();

    const VisibleItems = React.useMemo(() => {
        return Items.filter((Item) => {
            if (!QueryText) return true;

            return [GetLabel(Item), GetMeta(Item)].join(" ").toLowerCase().includes(QueryText);
        });
    }, [GetLabel, GetMeta, Items, QueryText]);

    React.useEffect(() => {
        function HandleClick(Event: MouseEvent) {
            if (!DropdownRef.current) return;
            if (!DropdownRef.current.contains(Event.target as Node)) {
                SetOpen(false);
                SetQuery("");
            };
        };

        document.addEventListener("mousedown", HandleClick);

        return () => {
            document.removeEventListener("mousedown", HandleClick);
        };
    }, []);

    return (
        <div ref={DropdownRef} className="relative w-full md:w-80">
            <button type="button" onClick={() => SetOpen((Value) => !Value)} className={`inline-flex h-12 w-full cursor-pointer items-center overflow-hidden rounded-md border border-zinc-800 bg-zinc-900 text-sm font-semibold text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900/90 ${Open ? "border-zinc-700 bg-zinc-950" : ""}`}>
                <div className="flex h-full w-12 shrink-0 items-center justify-center border-r border-zinc-800 bg-zinc-950/60 text-zinc-500">
                    {Icon}
                </div>

                <div className="min-w-0 flex-1 px-3 text-left">
                    <div className="truncate text-sm leading-none text-white">
                        {SelectedItem ? GetLabel(SelectedItem) : Placeholder}
                    </div>

                    <div className="mt-1 truncate text-[10px] leading-none text-zinc-500">
                        {SelectedItem ? GetMeta(SelectedItem) : "Unavailable"}
                    </div>
                </div>

                <Lucide.ChevronDown className={`mr-3 h-4 w-4 shrink-0 text-zinc-500 transition ${Open ? "rotate-180 text-zinc-300" : ""}`}/>
            </button>

            {Open && (
                <div className="absolute left-0 z-50 mt-2 w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 shadow-2xl">
                    <div className="border-b border-zinc-800 p-2">
                        <div className="group relative">
                            <Lucide.Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 transition group-focus-within:text-zinc-300"/>

                            <input type="text" value={Query} onChange={(Event) => SetQuery(Event.target.value)} placeholder={Placeholder} className="h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-700"/>
                        </div>
                    </div>

                    <div className="custom-scrollbar max-h-72 overflow-y-auto p-1.5">
                        {VisibleItems.length > 0 ? VisibleItems.map((Item) => {
                            const Key = GetKey(Item);
                            const Badge = GetBadge ? GetBadge(Item) : null;
                            const Selected = SelectedItem ? GetKey(SelectedItem) === Key : false;

                            return (
                                <button key={Key} type="button" onClick={() => {OnSelect(Item); SetOpen(false); SetQuery("")}} className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm font-semibold transition ${Selected ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"}`}>
                                    {Badge && (
                                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full border ${Badge.ClassName}`}/>
                                    )}

                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate">
                                            {GetLabel(Item)}
                                        </span>

                                        <span className="mt-0.5 block truncate text-[10px] font-medium text-zinc-500">
                                            {GetMeta(Item)}
                                        </span>
                                    </span>

                                    {Selected && <Lucide.Check className="h-4 w-4 shrink-0 text-zinc-300"/>}
                                </button>
                            );
                        }) : (
                            <div className="px-3 py-6 text-center text-sm text-zinc-500">
                                No items found.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

function ViewerLoadingScreen({State}: {State: ViewerLoadState}) {
    if (!State.Active) return null;

    return (
        <div className="relative flex h-full min-h-64 flex-col items-center justify-center text-center">
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.22),transparent_38%)]" />
            <div className="absolute left-1/2 top-1/2 z-0 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-3xl" />

            <section className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center px-6 py-16 text-center">
                <h1 className="bg-linear-to-b from-indigo-300 to-indigo-400 bg-clip-text text-6xl font-black tracking-tight text-transparent sm:text-7xl">
                    Initial Process
                </h1>

                <p className="mt-5 max-w-md text-sm leading-6 text-zinc-400 sm:text-base">
                    We're currently attempting {State.Label}
                </p>
            </section>
        </div>
    );
};

const ViewableModel = React.memo(function ViewableModel({ModelPath, TexturePath, Rotating, OnModelReady, OnTextureLoadChange}: ViewableModelProps) {
    const GLTF = ReactThreeDrei.useGLTF(ModelPath);
    const Scene = React.useMemo(() => SkeletonUtil.clone(GLTF.scene) as Three.Group, [GLTF.scene]);
    const Group = React.useRef<Three.Group>(null);
    const Controls = React.useRef<React.ElementRef<typeof ReactThreeDrei.OrbitControls>>(null);
    const Materials = React.useRef<{
        Material: Three.MeshBasicMaterial;
        OriginalMaterials: Map<Three.Mesh, Three.Material | Three.Material[]>;
        Applied: boolean;
    } | null>(null);
    const {camera, invalidate} = ReactThreeFiber.useThree();

    React.useEffect(() => {
        OnModelReady(ModelPath);
    }, [ModelPath, OnModelReady]);

    ReactThreeFiber.useFrame((_, Delta) => {
        if (Rotating && Group.current) {
            Group.current.rotation.y += Delta * 0.7;
        };
    });

    React.useEffect(() => {
        if (!Rotating) return;

        let AnimationFrame = 0;

        function Render() {
            invalidate();
            AnimationFrame = window.requestAnimationFrame(Render);
        };

        Render();

        return () => {
            window.cancelAnimationFrame(AnimationFrame);
        };
    }, [Rotating, invalidate]);

    React.useEffect(() => {
        Scene.position.set(0, 0, 0);

        const Box = new Three.Box3().setFromObject(Scene);
        if (Box.isEmpty()) return;

        const Center = Box.getCenter(new Three.Vector3());
        const Size = Box.getSize(new Three.Vector3());
        const MaxDim = Math.max(Size.x, Size.y, Size.z);
        const CameraDistance = Math.max(MaxDim * 2.15, 2.5);
        const TargetHeight = Size.y * 0.5;

        Scene.position.set(-Center.x, -Box.min.y, -Center.z);
        camera.position.set(0, TargetHeight, CameraDistance);
        camera.lookAt(0, TargetHeight, 0);

        Controls.current?.target.set(0, TargetHeight, 0);
        Controls.current?.update();
        invalidate();
    }, [Scene, camera, invalidate]);

    React.useEffect(() => {
        const CurrentMaterials = {
            Material: new Three.MeshBasicMaterial({toneMapped: false}),
            OriginalMaterials: new Map<Three.Mesh, Three.Material | Three.Material[]>(),
            Applied: false,
        };

        Materials.current = CurrentMaterials;

        return () => {
            CurrentMaterials.OriginalMaterials.forEach((OriginalMaterial, Mesh) => {
                Mesh.material = OriginalMaterial;
            });

            CurrentMaterials.Material.map?.dispose();
            CurrentMaterials.Material.dispose();

            if (Materials.current === CurrentMaterials) {
                Materials.current = null;
            };
        };
    }, [Scene]);

    React.useEffect(() => {
        if (!Materials.current) return;

        let Cancelled = false;
        let ObjectUrl: string | null = null;
        let AnimationFrame = 0;
        let FrameTimer = 0;
        let GifAbortController: AbortController | null = null;
        let GifDecoder: ImageDecoder | null = null;
        let CurrentTexture: Three.Texture | null = null;
        const TextureDetail = FormatAssetName(TexturePath);
        const TextureKind = GetTextureSourceKind(TexturePath);

        function ReportProgress(Label: string, Active = true) {
            if (Cancelled) return;

            OnTextureLoadChange({
                Active,
                Label,
                Detail: TextureDetail,
            });
        };

        function ConfigureTexture(Texture: Three.Texture) {
            Texture.colorSpace = Three.SRGBColorSpace;
            Texture.flipY = false;
            Texture.generateMipmaps = false;
            Texture.magFilter = Three.LinearFilter;
            Texture.minFilter = Three.LinearFilter;
            Texture.wrapS = Three.RepeatWrapping;
            Texture.wrapT = Three.RepeatWrapping;
        };

        function ApplyMaterial() {
            const CurrentMaterials = Materials.current;
            if (!CurrentMaterials || CurrentMaterials.Applied) return;

            Scene.traverse((Object) => {
                const Mesh = Object as Three.Mesh;

                if (Mesh.isMesh) {
                    CurrentMaterials.OriginalMaterials.set(Mesh, Mesh.material);
                    Mesh.material = CurrentMaterials.Material;
                };
            });

            CurrentMaterials.Applied = true;
        };

        function AttachTexture(Texture: Three.Texture) {
            const CurrentMaterials = Materials.current;
            if (!CurrentMaterials || Cancelled) return;

            if (CurrentMaterials.Material.map && CurrentMaterials.Material.map !== Texture) {
                CurrentMaterials.Material.map.dispose();
            };

            CurrentTexture = Texture;
            CurrentMaterials.Material.map = Texture;
            CurrentMaterials.Material.needsUpdate = true;
            ApplyMaterial();
            invalidate();
        };

        function MarkTextureReady(Texture: Three.Texture) {
            AttachTexture(Texture);
            ReportProgress("", false);
        }

        function CleanupTexture() {
            if (AnimationFrame) {
                window.cancelAnimationFrame(AnimationFrame);
            };

            if (FrameTimer) {
                window.clearTimeout(FrameTimer);
            };

            GifAbortController?.abort();
            GifDecoder?.close();

            const CurrentMaterials = Materials.current;

            if (CurrentTexture && CurrentMaterials?.Material.map === CurrentTexture) {
                CurrentMaterials.Material.map = null;
                CurrentMaterials.Material.needsUpdate = true;
            };

            CurrentTexture?.dispose();
            CurrentTexture = null;

            if (ObjectUrl) {
                URL.revokeObjectURL(ObjectUrl);
            };
        };

        ReportProgress("Queueing skin texture");

        if (TextureKind === "gif") {
            const CanvasElement = document.createElement("canvas");
            const Context = CanvasElement.getContext("2d");

            if (!Context) {
                ReportProgress("Skin texture failed", false);
                return;
            };

            const CanvasContext = Context;
            const Texture = new Three.CanvasTexture(CanvasElement);
            ConfigureTexture(Texture);

            function StartFallbackImageTexture() {
                const ImageElement = new Image();
                let ImageReady = false;

                function DrawFrame() {
                    if (Cancelled || !ImageReady) return;

                    CanvasContext.clearRect(0, 0, CanvasElement.width, CanvasElement.height);
                    CanvasContext.drawImage(ImageElement, 0, 0, CanvasElement.width, CanvasElement.height);
                    Texture.needsUpdate = true;
                    invalidate();

                    AnimationFrame = window.requestAnimationFrame(DrawFrame);
                };

                function HandleLoad() {
                    if (Cancelled) return;

                    CanvasElement.width = ImageElement.naturalWidth || 512;
                    CanvasElement.height = ImageElement.naturalHeight || 512;
                    ImageReady = true;
                    MarkTextureReady(Texture);
                    DrawFrame();
                };

                function HandleError() {
                    ReportProgress("Skin texture failed", false);
                };

                ImageElement.addEventListener("load", HandleLoad, {once: true});
                ImageElement.addEventListener("error", HandleError, {once: true});

                if (TexturePath instanceof File) {
                    ObjectUrl = URL.createObjectURL(TexturePath);
                    ImageElement.src = ObjectUrl;
                } else {
                    ImageElement.crossOrigin = "anonymous";
                    ImageElement.src = TexturePath;
                };

                if (ImageElement.complete && ImageElement.naturalWidth > 0) {
                    HandleLoad();
                };

                return () => {
                    ImageElement.removeEventListener("load", HandleLoad);
                    ImageElement.removeEventListener("error", HandleError);
                };
            };

            let CleanupFallbackImage: (() => void) | null = null;

            async function StartDecodedGifTexture() {
                if (typeof ImageDecoder === "undefined" || !(await ImageDecoder.isTypeSupported("image/gif").catch(() => false))) {
                    CleanupFallbackImage = StartFallbackImageTexture();
                    return;
                };

                try {
                    ReportProgress("to buffer the GIF frames.");

                    GifAbortController = new AbortController();
                    const GifData = TexturePath instanceof File
                        ? await TexturePath.arrayBuffer()
                        : await fetch(TexturePath, {signal: GifAbortController.signal}).then((Response) => {
                            if (!Response.ok) {
                                throw new Error(`Request failed with status ${Response.status}`);
                            };

                            return Response.arrayBuffer();
                        });

                    if (Cancelled) return;

                    GifDecoder = new ImageDecoder({
                        data: GifData,
                        preferAnimation: true,
                        type: "image/gif",
                    });

                    await GifDecoder.tracks.ready;

                    if (Cancelled || !GifDecoder) return;

                    if (GifDecoder.tracks.length > 0 && !GifDecoder.tracks.selectedTrack) {
                        GifDecoder.tracks[0].selected = true;
                    };

                    const SelectedTrack = GifDecoder.tracks.selectedTrack || GifDecoder.tracks[0];
                    const FrameCount = Math.max(SelectedTrack?.frameCount || 1, 1);
                    let FrameIndex = 0;

                    ReportProgress(`to decode ${FrameCount} GIF frame${FrameCount === 1 ? "" : "s"}.`);

                    async function RenderDecodedFrame() {
                        if (Cancelled || !GifDecoder) return;

                        try {
                            const Result = await GifDecoder.decode({
                                completeFramesOnly: true,
                                frameIndex: FrameIndex,
                            });
                            const DecodedFrame = Result.image;

                            if (Cancelled) {
                                DecodedFrame.close();
                                return;
                            };

                            const Width = DecodedFrame.displayWidth || DecodedFrame.codedWidth || 512;
                            const Height = DecodedFrame.displayHeight || DecodedFrame.codedHeight || 512;

                            if (CanvasElement.width !== Width || CanvasElement.height !== Height) {
                                CanvasElement.width = Width;
                                CanvasElement.height = Height;
                            };

                            CanvasContext.clearRect(0, 0, CanvasElement.width, CanvasElement.height);
                            CanvasContext.drawImage(DecodedFrame, 0, 0, CanvasElement.width, CanvasElement.height);

                            const FrameDelay = Math.max(20, Math.min(1000, (DecodedFrame.duration ?? 100000) / 1000));
                            DecodedFrame.close();

                            Texture.needsUpdate = true;
                            MarkTextureReady(Texture);
                            invalidate();

                            FrameIndex = (FrameIndex + 1) % FrameCount;
                            FrameTimer = window.setTimeout(RenderDecodedFrame, FrameDelay);
                        } catch {
                            if (Cancelled) return;

                            CleanupFallbackImage = StartFallbackImageTexture();
                        };
                    };

                    await RenderDecodedFrame();
                } catch {
                    if (Cancelled) return;

                    CleanupFallbackImage = StartFallbackImageTexture();
                };
            };

            ReportProgress("to load GIF texture.");
            StartDecodedGifTexture();

            return () => {
                Cancelled = true;
                CleanupFallbackImage?.();
                CleanupTexture();
            };
        };

        const VideoElement = document.createElement("video");
        VideoElement.loop = true;
        VideoElement.muted = true;
        VideoElement.playsInline = true;
        VideoElement.crossOrigin = "anonymous";
        VideoElement.preload = "auto";

        const Texture = new Three.VideoTexture(VideoElement);
        ConfigureTexture(Texture);

        function QueueFrame() {
            if (Cancelled) return;

            invalidate();
            AnimationFrame = window.requestAnimationFrame(QueueFrame);
        };

        function HandleLoadStart() {
            ReportProgress("to load video texture,");
        };

        function HandleLoadedMetadata() {
            ReportProgress("to load video texture.");
        };

        function HandleWaiting() {
            ReportProgress("to buffer video texture.");
        };

        function HandleError() {
            ReportProgress("Skin texture failed.", false);
        };

        function HandleTextureReady() {
            if (Cancelled) return;

            MarkTextureReady(Texture);
            VideoElement.play().catch(() => {});
            if (!AnimationFrame) {
                QueueFrame();
            };
        };

        VideoElement.addEventListener("loadstart", HandleLoadStart);
        VideoElement.addEventListener("loadedmetadata", HandleLoadedMetadata);
        VideoElement.addEventListener("waiting", HandleWaiting);
        VideoElement.addEventListener("stalled", HandleWaiting);
        VideoElement.addEventListener("error", HandleError);
        VideoElement.addEventListener("loadeddata", HandleTextureReady);
        VideoElement.addEventListener("canplay", HandleTextureReady);
        VideoElement.addEventListener("playing", HandleTextureReady);

        if (TexturePath instanceof File) {
            ObjectUrl = URL.createObjectURL(TexturePath);
            VideoElement.src = ObjectUrl;
        } else {
            VideoElement.src = TexturePath;
        };

        VideoElement.load();

        if (VideoElement.readyState >= 2) {
            HandleTextureReady();
        };

        return () => {
            Cancelled = true;
            VideoElement.removeEventListener("loadstart", HandleLoadStart);
            VideoElement.removeEventListener("loadedmetadata", HandleLoadedMetadata);
            VideoElement.removeEventListener("waiting", HandleWaiting);
            VideoElement.removeEventListener("stalled", HandleWaiting);
            VideoElement.removeEventListener("error", HandleError);
            VideoElement.removeEventListener("loadeddata", HandleTextureReady);
            VideoElement.removeEventListener("canplay", HandleTextureReady);
            VideoElement.removeEventListener("playing", HandleTextureReady);
            VideoElement.pause();
            VideoElement.removeAttribute("src");
            VideoElement.load();
            CleanupTexture();
        };
    }, [TexturePath, Scene, OnTextureLoadChange, invalidate]);

    return (
        <>
            <primitive ref={Group} object={Scene} dispose={null}/>
            <ReactThreeDrei.OrbitControls ref={Controls} enableZoom enablePan={false} onChange={() => invalidate()}/>
        </>
    );
});

export default function Page() {
    const [SearchParams, SetSearchParams] = ReactRouter.useSearchParams();
    const {SetTopbarContent, SetFooterContent} = ReactRouter.useOutletContext<LayoutOutletContext>();
    const ModelLoadProgress = ReactThreeDrei.useProgress();

    const Models = React.useMemo(() => {
        return [...ModelsData.Models];
    }, []);
    const Skins = React.useMemo(() => {
        return SkinsData.Skins.map((Skin, Index) => ({Skin, Index}))
        .sort((A, B) => A.Skin.type - B.Skin.type || A.Index - B.Index)
        .map((Item) => Item.Skin);
    }, []);

    const [SelectedModel, SetSelectedModel] = React.useState<ModelsType.ModelObject | null>(() => FindModelByName(Models, SearchParams.get("model")));
    const [SelectedSkin, SetSelectedSkin] = React.useState<SkinsType.SkinsObject | null>(() => FindSkinByName(Skins, SearchParams.get("skin")));
    const [CustomFile, SetCustomFile] = React.useState<File | null>(null);
    const [CustomPreviewUrl, SetCustomPreviewUrl] = React.useState<string | null>(null);
    const [PendingModelPath, SetPendingModelPath] = React.useState(() => SelectedModel ? GetModelPath(SelectedModel) : null);
    const [SkinLoadState, SetSkinLoadState] = React.useState<ViewerLoadState>(EmptyLoadState);
    const [Rotating, SetRotating] = React.useState(true);
    const [UploadMessage, SetUploadMessage] = React.useState<string | null>(null);
    const [UploadIsError, SetUploadIsError] = React.useState(false);

    React.useEffect(() => {
        if (!CustomFile) {
            SetCustomPreviewUrl(null);
            return;
        };

        const PreviewUrl = URL.createObjectURL(CustomFile);
        SetCustomPreviewUrl(PreviewUrl);

        return () => {
            URL.revokeObjectURL(PreviewUrl);
        };
    }, [CustomFile]);

    React.useEffect(() => {
        const NextModel = FindModelByName(Models, SearchParams.get("model"));
        if (!NextModel || SelectedModel?.name === NextModel.name) return;

        SetSelectedModel(NextModel);
    }, [Models, SearchParams, SelectedModel?.name]);

    React.useEffect(() => {
        if (CustomFile) return;

        const NextSkin = FindSkinByName(Skins, SearchParams.get("skin"));
        if (!NextSkin || SelectedSkin?.name === NextSkin.name) return;

        SetSelectedSkin(NextSkin);
    }, [CustomFile, SearchParams, SelectedSkin?.name, Skins]);

    React.useEffect(() => {
        if (!SelectedModel) return;

        const ModelPath = GetModelPath(SelectedModel);
        PreloadModel(ModelPath);
        SetPendingModelPath(ModelPath);
    }, [SelectedModel]);

    React.useEffect(() => {
        if (!SelectedSkin) return;

        const TexturePath = CustomFile || GetSkinPath(SelectedSkin);

        PreloadTexture(TexturePath);
        SetSkinLoadState({
            Active: true,
            Label: "to queue the skin texture.",
            Detail: FormatAssetName(TexturePath),
        });
    }, [CustomFile, SelectedSkin]);

    const UpdateSearchParam = React.useCallback((Key: string, Value: string) => {
        SetSearchParams((Previous) => {
            const Parameters = new URLSearchParams(Previous);
            Parameters.set(Key, Value);
            return Parameters;
        });
    }, [SetSearchParams]);

    const CustomFileKind = React.useMemo(() => CustomFile ? GetTextureSourceKind(CustomFile) : null, [CustomFile]);
    const CustomSkinName = CustomFileKind === "gif" ? "Custom GIF" : CustomFileKind === "video" ? "Custom MP4" : "";
    const CustomSkinItem = React.useMemo<SkinsType.SkinsObject | null>(() => {
        if (!CustomFile || !CustomPreviewUrl) return null;

        return {
            name: CustomSkinName,
            internal_id: "custom-upload",
            steam_id: "N/A",
            discord_id: null,
            file_path: CustomPreviewUrl,
            type: SkinsType.SkinsRarity.UNCATEGORIZED,
            created_at: null,
        };
    }, [CustomFile, CustomPreviewUrl, CustomSkinName]);
    const DisplaySkins = React.useMemo(() => CustomSkinItem ? [CustomSkinItem, ...Skins] : Skins, [CustomSkinItem, Skins]);
    const DisplaySkin = CustomSkinItem ?? SelectedSkin;
    const TexturePath = CustomFile || (SelectedSkin ? GetSkinPath(SelectedSkin) : "");

    const HandleModelReady = React.useCallback((ModelPath: string) => {
        SetPendingModelPath((CurrentPath) => CurrentPath === ModelPath ? null : CurrentPath);
    }, []);

    const HandleTextureLoadChange = React.useCallback((State: ViewerLoadState) => {
        SetSkinLoadState(State);
    }, []);

    const SelectSkin = React.useCallback((Skin: SkinsType.SkinsObject) => {
        if (Skin.internal_id === "custom-upload") return;

        SetCustomFile(null);
        SetUploadMessage(null);
        SetUploadIsError(false);
        SetSelectedSkin(Skin);
        UpdateSearchParam("skin", Skin.name);
    }, [UpdateSearchParam]);

    const SelectModel = React.useCallback((Model: ModelsType.ModelObject) => {
        SetSelectedModel(Model);
        UpdateSearchParam("model", Model.name);
    }, [UpdateSearchParam]);

    const HandleRandomSkin = React.useCallback(() => {
        if (Skins.length === 0) return;

        const AvailableSkins = Skins.filter((Skin) => !SelectedSkin || Skin.name !== SelectedSkin.name || CustomFile !== null);
        const SkinPool = AvailableSkins.length > 0 ? AvailableSkins : Skins;
        const RandomSkin = SkinPool[Math.floor(Math.random() * SkinPool.length)];
        if (!RandomSkin) return;

        SelectSkin(RandomSkin);
    }, [CustomFile, SelectSkin, SelectedSkin, Skins]);

    const HandleUpload = React.useCallback((Event: React.ChangeEvent<HTMLInputElement>) => {
        const UploadedFile = Event.currentTarget.files?.[0];
        Event.currentTarget.value = "";

        if (!UploadedFile) {
            SetUploadMessage("That file does not exist.");
            SetUploadIsError(true);
            return;
        };

        const FileName = UploadedFile.name.toLowerCase();
        const ValidFile = UploadedFile.type === "video/mp4" || UploadedFile.type === "image/gif" || FileName.endsWith(".mp4") || FileName.endsWith(".gif");

        if (!ValidFile) {
            SetUploadMessage("Only MP4 and GIF file types are allowed.");
            SetUploadIsError(true);
            return;
        };

        if (UploadedFile.size > 50 * 1024 * 1024) {
            SetUploadMessage("Uploaded files must be under 50 megabytes.");
            SetUploadIsError(true);
            return;
        };

        const TextureKind = GetTextureSourceKind(UploadedFile);

        SetCustomFile(UploadedFile);
        SetUploadMessage(`Successfully loaded ${TextureKind === "gif" ? "GIF" : "MP4"}.`);
        SetUploadIsError(false);
        SetSkinLoadState({
            Active: true,
            Label: "to queue the skin texture.",
            Detail: UploadedFile.name,
        });
    }, []);

    React.useEffect(() => {
        if (!UploadMessage) return;

        const Timer = window.setTimeout(() => {
            SetUploadMessage(null);
            SetUploadIsError(false);
        }, 3200);

        return () => {
            window.clearTimeout(Timer);
        };
    }, [UploadMessage]);

    const CurrentLoadState = React.useMemo<ViewerLoadState>(() => {
        if (!SelectedModel || !SelectedSkin || !TexturePath) {
            return {
                Active: true,
                Progress: 25,
                Label: "to prepare the viewer for use.",
            };
        };

        const ModelPath = GetModelPath(SelectedModel);

        if (PendingModelPath === ModelPath) {
            return {
                Active: true,
                Label: "to load the model.",
                Detail: SelectedModel.name,
            };
        };

        if (SkinLoadState.Active) {
            return SkinLoadState;
        };

        return EmptyLoadState;
    }, [ModelLoadProgress.active, ModelLoadProgress.progress, PendingModelPath, SelectedModel, SelectedSkin, SkinLoadState, TexturePath]);

    React.useEffect(() => {
        SetTopbarContent(
            <>
                <ViewerSelect
                    Icon={<Lucide.Sparkles className="h-4 w-4"/>}
                    Items={DisplaySkins}
                    SelectedItem={DisplaySkin}
                    Placeholder="Search skins"
                    GetKey={(Skin) => `${Skin.internal_id}-${Skin.file_path}`}
                    GetLabel={(Skin) => Skin.name}
                    GetMeta={(Skin) => Skin.internal_id === "custom-upload" ? "Custom upload" : Skin.internal_id}
                    GetBadge={(Skin) => {
                        const Rarity = GetRarity(Skin.type);

                        return {
                            Label: Rarity.name,
                            ClassName: Rarity.class,
                        };
                    }}
                    OnSelect={SelectSkin}
                />

                <ViewerSelect
                    Icon={<Lucide.Box className="h-4 w-4"/>}
                    Items={Models}
                    SelectedItem={SelectedModel}
                    Placeholder="Search models"
                    GetKey={(Model) => `${Model.type}-${Model.file_path}`}
                    GetLabel={(Model) => Model.name}
                    GetMeta={(Model) => ModelTypeLabels[Model.type]}
                    GetBadge={(Model) => ({
                        Label: ModelTypeLabels[Model.type],
                        ClassName: Model.type === ModelsType.ModelType.WEAPON ? "border-blue-400/50 bg-blue-500/15 text-blue-300" : "border-indigo-400/50 bg-indigo-500/15 text-indigo-300",
                    })} OnSelect={SelectModel}
                />

                <label title="Upload MP4 or GIF skin" className={TopbarButtonClassName}>
                    <Lucide.Upload className="h-5 w-5"/>
                    <input type="file" accept="video/mp4,image/gif,.mp4,.gif" className="hidden" onChange={HandleUpload}/>
                </label>

                <button type="button" title="Random skin" disabled={Skins.length === 0} onClick={HandleRandomSkin} className={TopbarButtonClassName}>
                    <Lucide.Dices className="h-5 w-5"/>
                </button>

                <button type="button" title={Rotating ? "Pause rotation" : "Play rotation"} onClick={() => SetRotating((Value) => !Value)} className={TopbarButtonClassName}>
                    {Rotating ? <Lucide.Pause className="h-5 w-5"/> : <Lucide.Play className="h-5 w-5"/>}
                </button>
            </>
        );

        return () => {
            SetTopbarContent(null);
        };
    }, [DisplaySkin, DisplaySkins, HandleRandomSkin, HandleUpload, Models, Rotating, SelectModel, SelectSkin, SelectedModel, SetTopbarContent, Skins.length]);

    React.useEffect(() => {
        SetFooterContent(null);

        return () => {
            SetFooterContent(null);
        };
    }, [SetFooterContent]);

    return (
        <main className="relative h-full min-h-0 w-full overflow-hidden rounded-lg text-white">
            <div className={`absolute inset-0 transition-opacity duration-300 ${CurrentLoadState.Active ? "opacity-0" : "opacity-100"}`}>
                {SelectedModel && SelectedSkin && TexturePath && (
                    <ReactThreeFiber.Canvas camera={{fov: 40}} gl={{alpha: true, antialias: true}} className="h-full w-full">
                        <ambientLight intensity={0.65}/>
                        <directionalLight position={[5, 7, 5]} intensity={1.4}/>
                        <directionalLight position={[-4, 3, -5]} intensity={0.45}/>

                        <React.Suspense fallback={null}>
                            <ViewableModel ModelPath={GetModelPath(SelectedModel)} TexturePath={TexturePath} Rotating={Rotating} OnModelReady={HandleModelReady} OnTextureLoadChange={HandleTextureLoadChange}/>
                        </React.Suspense>
                    </ReactThreeFiber.Canvas>
                )}
            </div>

            {UploadMessage && (
                <div className={`absolute right-3 top-3 z-20 flex max-w-xs items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold shadow-2xl backdrop-blur ${UploadIsError ? "border-red-400/40 bg-red-500/10 text-red-200" : "border-zinc-700 bg-zinc-950/75 text-zinc-200"}`}>
                    {UploadIsError ? <Lucide.TriangleAlert className="h-4 w-4 shrink-0 text-red-300"/> : <Lucide.Check className="h-4 w-4 shrink-0 text-green-300"/>}

                    <span className="min-w-0 truncate">
                        {UploadMessage}
                    </span>
                </div>
            )}

            <ViewerLoadingScreen State={CurrentLoadState}/>
        </main>
    );
};