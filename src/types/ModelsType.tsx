export const ModelType = {
    SUIT: 0,
    WEAPON: 1,
};

export type ModelType = typeof ModelType[keyof typeof ModelType];

export type ModelObject = {
    name: string;
    file_path: string;
    type: ModelType;
};