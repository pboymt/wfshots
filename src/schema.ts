import Ajv, { JSONSchemaType } from 'ajv';

interface Rect {
    name: string;
}

interface Screenshot {
    id: string;
    name: string;
    description: string;
    rects: Rect[];
}

export interface Dictionary {
    list: Screenshot[];
}

const schema: JSONSchemaType<Dictionary> = {
    type: 'object',
    properties: {
        list: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    rects: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                            },
                            required: ['name'],
                        }
                    }
                },
                required: ['id', 'description'],
                additionalProperties: false,
            },
        },
    },
    required: ['list'],
    additionalProperties: false,
};

export function validateDictionary(dictionary: unknown): dictionary is Dictionary {
    const ajv = new Ajv.default();
    const validate = ajv.compile(schema);
    const valid = validate(dictionary);
    if (!valid) {
        console.error(validate.errors);
    }
    return valid;
}
