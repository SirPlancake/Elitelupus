import {Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList} from "@/components/ui/combobox";
import {toast} from "sonner";
import {useSearchParams} from "react-router-dom";
import {RefreshCw, Upload} from "lucide-react";
import {Canvas, useFrame, useThree} from "@react-three/fiber";
import {OrbitControls, useGLTF} from "@react-three/drei";
import React, {useRef, useEffect, useState, useMemo} from "react";
import * as THREE from "three";

import {type SkinObject, SkinTypes, SkinOrders} from "@/types/Skin.ts";
import {type ModelObject, ModelTypes, ModelOrders} from "@/types/Model.ts";
import Config from "../../vite.app.config.ts";

export default function Page() {
    const Rotation = useRef(false);
    const [SearchParams, setSearchParams] = useSearchParams();
    const [Loading, setLoading] = useState(true);
    const [Skins, setSkins] = useState<SkinObject[]>([]);
    const [Models, setModels] = useState<ModelObject[]>([]);
    const [SelectedSkin, setSelectedSkin] = useState<SkinObject | null>(null);
    const [SelectedModel, setSelectedModel] = useState<ModelObject | null>(null);
    const [CustomFile, setCustomFile] = useState<File | null>(null);

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
                        type: Item.type,
                    })).sort((A: SkinObject, B: SkinObject) => SkinOrders[A.type] - SkinOrders[B.type]);

                const ModelsData = (ModelsJson.data || [])
                .map((Item: ModelObject) => ({
                    id: Item.id,
                    name: Item.name,
                    path: Item.path,
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

    const GTLF = useMemo(() => {
        if (!SelectedModel) return null;
        return useGLTF(SelectedModel.path);
    }, [SelectedModel]);

    const HandleUpload = (Interaction: React.ChangeEvent<HTMLInputElement>) => {
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
    };

    const ViewableModel = useMemo(() => {
        return React.memo(function InnerModel({Path}: {Path: File | string}) {
            if (!GTLF) return null;
            
            const Group = useRef<THREE.Group>(null);
            const Controls = useRef<any>(null);
            const {camera} = useThree();
    
            const Video = useRef<HTMLVideoElement | null>(null);
            const Texture = useRef<THREE.VideoTexture | null>(null);
    
            useFrame((_, Delta) => {
                if (Group.current && !Rotation.current) {
                    Group.current.rotation.y += Delta * 0.7;
                };
            });
    
            useEffect(() => {
                const Scene = GTLF.scene;
                const Box = new THREE.Box3().setFromObject(Scene);
                const Center = Box.getCenter(new THREE.Vector3());
                const Size = Box.getSize(new THREE.Vector3());
    
                Scene.position.x -= Center.x;
                Scene.position.z -= Center.z;
                Scene.position.y -= Box.min.y;
    
                const MaxDim = Math.max(Size.x, Size.y, Size.z);
                camera.position.set(0, Size.y * 0.5, MaxDim * 2);
                camera.lookAt(0, Size.y * 0.5, 0);
    
                Controls.current?.target.set(0, Size.y * 0.5, 0);
                Controls.current?.update();
            }, [GTLF, camera]);
    
            useEffect(() => {
                const Scene = GTLF.scene;
                let CurrentVideo = Video.current;
    
                if (!CurrentVideo) {
                    CurrentVideo = document.createElement("video");
                    CurrentVideo.loop = true;
                    CurrentVideo.muted = true;
                    CurrentVideo.playsInline = true;
                    CurrentVideo.crossOrigin = "anonymous";
                    CurrentVideo.preload = "auto";
                    Video.current = CurrentVideo;
                };

                if (Path instanceof File) {
                    CurrentVideo.src = URL.createObjectURL(Path);
                } else {
                    CurrentVideo.src = Path;
                };
    
                const HandleCanPlay = () => {
                    if (!Texture.current) {
                        Texture.current = new THREE.VideoTexture(CurrentVideo);
                        Texture.current.colorSpace = THREE.SRGBColorSpace;
                        Texture.current.flipY = false;
    
                        Scene.traverse((Object: any) => {
                            if (Object.isMesh) {
                                Object.material = new THREE.MeshBasicMaterial({map: Texture.current});
                            };
                        });
                    };

                    CurrentVideo.play().catch(() => {});
                };
            
                CurrentVideo.addEventListener("canplay", HandleCanPlay);

                return () => {
                    CurrentVideo.removeEventListener("canplay", HandleCanPlay);
                };
            }, [GTLF, Path]);
    
            return (
                <>
                    <primitive ref={Group} object={GTLF.scene} />
                    <OrbitControls ref={Controls} enableZoom enablePan={false} />
                </>
            );
        });
    }, [GTLF]);

    return (
        <>
            <main className="flex-1 flex flex-col rounded-lg border border-zinc-800/75 bg-zinc-900/75 overflow-hidden">
                {Loading ? (
                    <div className="flex flex-1 items-center justify-center">
                        <RefreshCw className="animate-spin h-24 w-24 text-zinc-300"/>
                    </div>
                ) : (
                    <>
                        <div className="border-b border-zinc-800 bg-zinc-950 p-3 rounded-t-lg h-20 flex items-center gap-3">
                            <div className="relative w-60 ml-1 z-35">
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

                            <div className="relative w-60 z-35">
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

                            <div className="relative">
                                <label className="cursor-pointer flex flex-1 w-16 h-10.5 items-center justify-center rounded-md border border-zinc-700 bg-zinc-800 text-white/70 transition hover:border-zinc-600 hover:text-white">
                                    <Upload className="h-5 w-5"/>
                                    <input type="file" accept="video/mp4" className="hidden" onChange={HandleUpload} />
                                </label>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 relative">
                            <Canvas camera={{fov: 40}} className="w-full h-full">
                                <ambientLight intensity={0.6} />
                                <directionalLight position={[5, 5, 5]} />
                                {SelectedSkin && <ViewableModel Path={CustomFile || SelectedSkin.texture_url} />}
                            </Canvas>
                        </div>

                        <div className="border-t border-zinc-800 bg-zinc-950 p-3 rounded-b-lg">
                            <div className="flex gap-2 justify-between h-10"></div>
                        </div>
                    </>
                )}
            </main>
        </>
    );
};