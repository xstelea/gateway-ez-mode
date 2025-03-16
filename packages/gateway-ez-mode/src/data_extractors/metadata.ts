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
    [key: string]: MetadataTypedValue['type'];
};

export class MetadataExtractor {
    private metadataItems: EntityMetadataCollection;

    constructor(metadataItems: EntityMetadataCollection) {
        this.metadataItems = metadataItems;
    }

    public extractMetadataValue<T extends MetadataTypedValue['type']>(
        key: string,
        type: T
    ): OutputTypeForType<T> | null {
        const item = this.metadataItems.items.find((item) => item.key === key);
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

    public extractAllMetadataValues<T extends MetadataValueDescription>(
        descriptions: T
    ): { [K in keyof T]: OutputTypeForType<T[K]> | null } {
        return Object.fromEntries(
            Object.entries(descriptions).map(([key, type]) => [
                key,
                this.extractMetadataValue(key, type),
            ])
        ) as { [K in keyof T]: OutputTypeForType<T[K]> | null };
    }
}
