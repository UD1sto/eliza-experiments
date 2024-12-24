[@elizaos/core v0.1.6-alpha.4](../index.md) / GenerationOptions

# Interface: GenerationOptions

Configuration options for generating objects with a model.

## Properties

### runtime

> **runtime**: [`IAgentRuntime`](IAgentRuntime.md)

#### Defined in

[packages/core/src/generation.ts:1236](https://github.com/elizaos/eliza/blob/main/packages/core/src/generation.ts#L1236)

---

### context

> **context**: `string`

#### Defined in

[packages/core/src/generation.ts:1237](https://github.com/elizaos/eliza/blob/main/packages/core/src/generation.ts#L1237)

---

### modelClass

> **modelClass**: [`ModelClass`](../enumerations/ModelClass.md)

#### Defined in

[packages/core/src/generation.ts:1238](https://github.com/elizaos/eliza/blob/main/packages/core/src/generation.ts#L1238)

---

### schema?

> `optional` **schema**: `ZodSchema`

#### Defined in

[packages/core/src/generation.ts:1239](https://github.com/elizaos/eliza/blob/main/packages/core/src/generation.ts#L1239)

---

### schemaName?

> `optional` **schemaName**: `string`

#### Defined in

[packages/core/src/generation.ts:1240](https://github.com/elizaos/eliza/blob/main/packages/core/src/generation.ts#L1240)

---

### schemaDescription?

> `optional` **schemaDescription**: `string`

#### Defined in

[packages/core/src/generation.ts:1241](https://github.com/elizaos/eliza/blob/main/packages/core/src/generation.ts#L1241)

---

### stop?

> `optional` **stop**: `string`[]

#### Defined in

[packages/core/src/generation.ts:1242](https://github.com/elizaos/eliza/blob/main/packages/core/src/generation.ts#L1242)

---

### mode?

> `optional` **mode**: `"auto"` \| `"json"` \| `"tool"`

#### Defined in

[packages/core/src/generation.ts:1243](https://github.com/elizaos/eliza/blob/main/packages/core/src/generation.ts#L1243)

---

### experimental_providerMetadata?

> `optional` **experimental_providerMetadata**: `Record`\<`string`, `unknown`\>

#### Defined in

[packages/core/src/generation.ts:1244](https://github.com/elizaos/eliza/blob/main/packages/core/src/generation.ts#L1244)
