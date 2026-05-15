import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { Pause, Play, RefreshCw, Upload } from "lucide-react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";

import { type SkinObject, SkinTypes, SkinOrders } from "@/types/Skin.ts";
import { type ModelObject, ModelTypes, ModelOrders } from "@/types/Model.ts";
import InventoryItem from "@/components/custom/InventoryItem.tsx";
import Config from "../../vite.app.config.ts";

function ViewableModel({
    modelUrl,
    textureSource,
    isRotating
}: {
    modelUrl: string;
    textureSource: File | string;
    isRotating: boolean;
}) {
    const { scene } = useGLTF(modelUrl);
    const Group = useRef<THREE.Group>(null);
    const Controls = useRef<any>(null);
    const { camera } = useThree();

    const Video = useRef<HTMLVideoElement | null>(null);
    const Texture = useRef<THREE.VideoTexture | null>(null);

    useFrame((_, Delta) => {
        if (isRotating && Group.current) {
            Group.current.rotation.y += Delta * 0.7;
        }
    });

    useEffect(() => {
        const Box = new THREE.Box3().setFromObject(scene);
        const Center = Box.getCenter(new THREE.Vector3());
        const Size = Box.getSize(new THREE.Vector3());

        scene.position.set(-Center.x, -Box.min.y, -Center.z);

        const MaxDim = Math.max(Size.x, Size.y, Size.z);
        camera.position.set(0, Size.y * 0.5, MaxDim * 2);
        camera.lookAt(0, Size.y * 0.5, 0);

        Controls.current?.target.set(0, Size.y * 0.5, 0);
        Controls.current?.update();
    }, [scene, camera]);

    useEffect(() => {
        const Scene = scene;
        let CurrentVideo = Video.current;

        if (!CurrentVideo) {
            CurrentVideo = document.createElement("video");
            CurrentVideo.loop = true;
            CurrentVideo.muted = true;
            CurrentVideo.playsInline = true;
            CurrentVideo.crossOrigin = "anonymous";
            CurrentVideo.preload = "auto";
            Video.current = CurrentVideo;
        }

        let ObjectURL: string | null = null;

        if (textureSource instanceof File) {
            ObjectURL = URL.createObjectURL(textureSource);
            CurrentVideo.src = ObjectURL;
        } else {
            CurrentVideo.src = textureSource;
        }

        const HandleCanPlay = () => {
            if (!Texture.current) {
                Texture.current = new THREE.VideoTexture(CurrentVideo);
                Texture.current.colorSpace = THREE.SRGBColorSpace;
                Texture.current.flipY = false;

                Scene.traverse((Object: any) => {
                    if (Object.isMesh) {
                        Object.material = new THREE.MeshBasicMaterial({ map: Texture.current });
                    }
                });
            }

            CurrentVideo.play().catch(() => {});
            if (ObjectURL) URL.revokeObjectURL(ObjectURL);
        };

        CurrentVideo.addEventListener("canplay", HandleCanPlay);

        return () => {
            CurrentVideo.removeEventListener("canplay", HandleCanPlay);
        };
    }, [scene, textureSource]);

    return (
        <>
            <primitive ref={Group} object={scene} />
            <OrbitControls ref={Controls} enableZoom enablePan={false} />
        </>
    );
}

export default function Page() {
    const [SearchParams, setSearchParams] = useSearchParams();
    const [Loading, setLoading] = useState(true);
    const [Skins, setSkins] = useState<SkinObject[]>([]);
    const [Models, setModels] = useState<ModelObject[]>([]);
    const [SelectedSkin, setSelectedSkin] = useState<SkinObject | null>(null);
    const [SelectedModel, setSelectedModel] = useState<ModelObject | null>(null);
    const [CustomFile, setCustomFile] = useState<File | null>(null);
    const [isRotating, setIsRotating] = useState(true);

    useEffect(() => {
        let RetryTimer: ReturnType<typeof setTimeout>;

        const FetchData = async () => {
            try {
                const [SkinsResponse, ModelsResponse] = await Promise.all([
                    fetch(`${Config.API_URL}/gmod/skins`),
                    fetch(`${Config.API_URL}/gmod/models`)
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
                        type: Item.type
                    }))
                    .sort((A: SkinObject, B: SkinObject) => SkinOrders[A.type] - SkinOrders[B.type]);

                const ModelsData = (ModelsJson.data || [])
                    .map((Item: ModelObject) => ({
                        id: Item.id,
                        name: Item.name,
                        model_url: Item.model_url,
                        class_name: Item.class_name,
                        type: Item.type
                    }))
                    .sort((A: ModelObject, B: ModelObject) => ModelOrders[A.type] - ModelOrders[B.type]);

                setSkins(SkinsData);
                setModels(ModelsData);
                setLoading(false);
            } catch {
                setLoading(true);
                RetryTimer = setTimeout(FetchData, 5000);
            }
        };

        FetchData();

        return () => {
            if (RetryTimer) clearTimeout(RetryTimer);
        };
    }, []);

    useEffect(() => {
        if (!Skins.length) return;
        const SkinParameter = SearchParams.get("skin");
        const Found = Skins.find((Skin) => Skin.name === SkinParameter);
        setSelectedSkin(Found || Skins[0]);
    }, [Skins, SearchParams]);

    useEffect(() => {
        if (SelectedModel?.model_url) {
            useGLTF.preload(SelectedModel.model_url);
        };
    }, [SelectedModel?.model_url]);

    useEffect(() => {
        if (!Models.length) return;
        const ModelParameter = SearchParams.get("model");
        const Found = Models.find((Model) => Model.name === ModelParameter);
        setSelectedModel(Found || Models[0]);
    }, [Models, SearchParams]);

    const HandleUpload = (Interaction: React.ChangeEvent<HTMLInputElement>) => {
        const File = Interaction.target.files?.[0];

        if (!File) {
            toast.error("That file does not exist.");
            Interaction.target.value = "";
            return;
        }

        const IsValid = File.type === "video/mp4" || File.name.toLowerCase().endsWith(".mp4");

        if (!IsValid) {
            toast.error("Only MP4 file types are allowed.");
            Interaction.target.value = "";
            return;
        }

        if (File.size > 50 * 1024 * 1024) {
            toast.error("Uploaded files must be under 50 megabytes.");
            Interaction.target.value = "";
            return;
        }

        toast.success("Successfully loaded the provided mp4.");
        setCustomFile(File);
    };

    const modelUrl = SelectedModel?.model_url;

    return (
        <main className="flex-1 flex flex-col rounded-lg border border-zinc-800/75 bg-zinc-900/75 overflow-hidden">
            {Loading ? (
                <div className="flex flex-1 items-center justify-center">
                    <RefreshCw className="animate-spin h-24 w-24 text-zinc-300" />
                </div>
            ) : (
                <>
                    <div className="border-b border-zinc-800 bg-zinc-950 p-3 rounded-t-lg h-20 flex items-center gap-3">
                        <div className="relative w-60 ml-1 z-35">
                            <Combobox items={Skins} value={SelectedSkin?.name || ""} onValueChange={(Value: any) => { const Skin = Skins.find((Skin) => Skin.name === Value); if (!Skin) return; setSelectedSkin(Skin); setCustomFile(null); setSearchParams((Prev) => {const P = new URLSearchParams(Prev); P.set("skin", Skin.name); return P; });}}>
                                <ComboboxInput className="h-full rounded-sm hover:border-zinc-600 transition bg-zinc-800 border border-zinc-700 text-white [&_svg]:text-zinc-400" />
                                <ComboboxContent className="my-2 bg-zinc-900 border border-zinc-700 rounded-sm z-50 text-gray-200">
                                    <ComboboxEmpty>No items found.</ComboboxEmpty>
                                    <ComboboxList>
                                        {(Item: SkinObject) => (
                                            <ComboboxItem key={Item.internal_id} value={Item.name} className="cursor-pointer w-full text-left px-3 py-2 text-white hover:bg-zinc-800 rounded-sm">
                                                [{SkinTypes[Item.type]}] {Item.name}
                                            </ComboboxItem>
                                        )}
                                    </ComboboxList>
                                </ComboboxContent>
                            </Combobox>
                        </div>

                        <div className="relative w-60 z-35">
                            <Combobox items={Models} value={SelectedModel?.name || ""} onValueChange={(Value: any) => { const Model = Models.find((Model) => Model.name === Value); if (!Model) return; setSelectedModel(Model); setSearchParams((Prev) => { const P = new URLSearchParams(Prev); P.set("model", Model.name); return P; });}}>
                                <ComboboxInput className="h-full rounded-sm hover:border-zinc-600 transition bg-zinc-800 border border-zinc-700 text-white [&_svg]:text-zinc-400" />
                                <ComboboxContent className="my-2 bg-zinc-900 border border-zinc-700 rounded-sm z-50 text-gray-200">
                                    <ComboboxEmpty>No items found.</ComboboxEmpty>
                                    <ComboboxList>
                                        {(Item: ModelObject) => (
                                            <ComboboxItem key={Item.id} value={Item.name} className="cursor-pointer w-full text-left px-3 py-2 text-white hover:bg-zinc-800 rounded-sm">
                                                [{ModelTypes[Item.type]}] {Item.name}
                                            </ComboboxItem>
                                        )}
                                    </ComboboxList>
                                </ComboboxContent>
                            </Combobox>
                        </div>

                        <div className="flex gap-2 justify-between items-center px-3 py-1 h-10.5 hover:cursor-pointer hover:border-zinc-600 rounded-md bg-zinc-800 border border-zinc-700 text-white hover:bg-zinc-700 transition">
                            <Upload className="h-5 w-5" />
                            <input type="file" accept="video/mp4" className="hidden" onChange={HandleUpload} />
                        </div>

                        <div className="flex gap-2 justify-between items-center">
                            <button onClick={() => setIsRotating((v) => !v)} className="px-3 py-1 h-10.5 hover:border-zinc-600 hover:cursor-pointer rounded-md bg-zinc-800 border border-zinc-700 text-white hover:bg-zinc-700 transition">
                                {isRotating ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 relative">
                        {SelectedModel?.class_name && (
                            <div className="absolute bottom-3 left-3 z-40">
                                <InventoryItem path={SelectedModel.type === 1 ? "weapons" : "suits"} weapon={SelectedModel.class_name || ""} skin={SelectedSkin?.image_url} rarity="common"/>
                            </div>
                        )}

                        <Canvas camera={{ fov: 40 }} className="w-full h-full">
                            <ambientLight intensity={0.6} />
                            <directionalLight position={[5, 5, 5]} />
                            {SelectedModel && modelUrl && (SelectedSkin?.texture_url || CustomFile) && (
                                <ViewableModel modelUrl={modelUrl} textureSource={CustomFile ?? SelectedSkin!.texture_url} isRotating={isRotating}/>
                            )}
                        </Canvas>
                    </div>

                    <div className="border-t border-zinc-800 bg-zinc-950 p-3 rounded-b-lg">
                        <div className="flex gap-2 justify-between h-10"></div>
                    </div>
                </>
            )}
        </main>
    );
}