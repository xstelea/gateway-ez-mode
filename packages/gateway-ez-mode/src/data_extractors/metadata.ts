import {
    EntityMetadataCollection,
    MetadataTypedValue,
} from '@radixdlt/babylon-gateway-api-sdk';

type GetMetadataValueWithType<T extends MetadataTypedValue['type']> = Extract<
    MetadataTypedValue,
    { type: T }
>;

type OutputTypeForType<T extends MetadataTypedValue['type']> =
    GetMetadataValueWithType<T> extends {
        values: infer U;
    }
        ? U
        : GetMetadataValueWithType<T> extends {
                value: infer U;
            }
          ? U
          : never;

export function extractMetadataValue<T extends MetadataTypedValue['type']>(
    metadataItems: EntityMetadataCollection,
    key: string,
    type: T
): OutputTypeForType<T> | null {
    const item = metadataItems.items.find((item) => item.key === key);
    if (!item) return null;
    if (item.value.typed.type !== type) return null;

    // If it's one of the array kinds, return `values`, else return `value`
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

export type MetadataValueDescription = {
    [key: string]: MetadataTypedValue['type'];
};

export function extractAllMetadataValues<T extends MetadataValueDescription>(
    metadataItems: EntityMetadataCollection,
    descriptions: T
): { [K in keyof T]: OutputTypeForType<T[K]> | null } {
    return Object.fromEntries(
        Object.entries(descriptions).map(([key, type]) => [
            key,
            extractMetadataValue(metadataItems, key, type),
        ])
    ) as { [K in keyof T]: OutputTypeForType<T[K]> | null };
}
