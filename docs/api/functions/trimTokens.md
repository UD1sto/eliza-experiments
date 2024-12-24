[@elizaos/core v0.1.6-alpha.4](../index.md) / trimTokens

# Function: trimTokens()

> **trimTokens**(`context`, `maxTokens`, `model`): `string`

Truncate the context to the maximum length allowed by the model.

## Parameters

• **context**: `string`

The text to truncate

• **maxTokens**: `number`

Maximum number of tokens to keep

• **model**: `TiktokenModel`

The tokenizer model to use

## Returns

`string`

The truncated text

## Defined in

[packages/core/src/generation.ts:580](https://github.com/elizaos/eliza/blob/main/packages/core/src/generation.ts#L580)
