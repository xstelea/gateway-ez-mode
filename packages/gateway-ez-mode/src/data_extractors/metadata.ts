import {
    EntityMetadataCollection,
    MetadataTypedValue,
} from '@radixdlt/babylon-gateway-api-sdk';

type GetMetadataValueWithType<T extends MetadataTypedValue['type']> = Extract<
    MetadataTypedValue,
    { type: T }
>;

export type OutputTypeForType<T extends MetadataTypedValue['type']> =
    GetMetadataValueWithType<T> extends {
        values: infer U;
    }
        ? U
        : GetMetadataValueWithType<T> extends {
                value: infer U;
            }
          ? U
          : never;

export type MetadataValueDescription = {
    [field_name: string]: MetadataTypedValue['type'];
};

export class MetadataExtractor {
    private metadataItems: EntityMetadataCollection;

    constructor(metadataItems: EntityMetadataCollection) {
        this.metadataItems = metadataItems;
    }

    /**
     * Get the raw metadata items of the resource
     * @returns
     */
    public getMetadataItemsRaw(): EntityMetadataCollection {
        return this.metadataItems;
    }

    /**
     * Get a single metadata value by field name
     * @param field_name The field name of the metadata value
     * @param type The type of the metadata value
     * @returns The metadata value or null if not found / type mismatch
     */
    public getMetadataValue<T extends MetadataTypedValue['type']>(
        field_name: string,
        type: T
    ): OutputTypeForType<T> | null {
        const item = this.metadataItems.items.find(
            (item) => item.key === field_name
        );
        if (!item) return null;
        if (item.value.typed.type !== type) return null;

        // If it's one of the array kinds, return `values`, else `value`
        if ('values' in item.value.typed) {
            return item.value.typed.values as OutputTypeForType<T>;
        } else if ('value' in item.value.typed) {
            return item.value.typed.value as OutputTypeForType<T>;
        } else {
            throw new Error(
                'metadata value should either have `value` or `values`'
            );
        }
    }

    /**
     * Get multiple metadata values by field name
     * @param descriptions An object where the keys are field names and the values are the types of the metadata values
     * @returns An object where the keys are field names and the values are the metadata values or null if not found / type mismatch
     * @example
     * ```ts
     * const { symbol, name, tags } = resource.getMetadataValues({
     *    symbol: 'String',
     *    name: 'String',
     *    tags: 'StringArray',
     * })
     * symbol // string | null
     * name // string | null
     * tagas // string[] | null
     * ```
     */
    public getMetadataValuesBatch<T extends MetadataValueDescription>(
        descriptions: T
    ): { [K in keyof T]: OutputTypeForType<T[K]> | null } {
        return Object.fromEntries(
            Object.entries(descriptions).map(([field_name, type]) => [
                field_name,
                this.getMetadataValue(field_name, type),
            ])
        ) as { [K in keyof T]: OutputTypeForType<T[K]> | null };
    }
}
