[@elizaos/core v0.1.6-alpha.4](../index.md) / IAgentRuntime

# Interface: IAgentRuntime

## Properties

### agentId

> **agentId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

Properties

#### Defined in

[packages/core/src/types.ts:1026](https://github.com/elizaos/eliza/blob/main/packages/core/src/types.ts#L1026)

---

### serverUrl

> **serverUrl**: `string`

#### Defined in

[packages/core/src/types.ts:1027](https://github.com/elizaos/eliza/blob/main/packages/core/src/types.ts#L1027)

---

### databaseAdapter

> **databaseAdapter**: [`IDatabaseAdapter`](IDatabaseAdapter.md)

#### Defined in

[packages/core/src/types.ts:1028](https://github.com/elizaos/eliza/blob/main/packages/core/src/types.ts#L1028)

---

### token

> **token**: `string`

#### Defined in

[packages/core/src/types.ts:1029](https://github.com/elizaos/eliza/blob/main/packages/core/src/types.ts#L1029)

---

### modelProvider

> **modelProvider**: [`ModelProviderName`](../enumerations/ModelProviderName.md)

#### Defined in

[packages/core/src/types.ts:1030](https://github.com/elizaos/eliza/blob/main/packages/core/src/types.ts#L1030)

---

### imageModelProvider

> **imageModelProvider**: [`ModelProviderName`](../enumerations/ModelProviderName.md)

#### Defined in

[packages/core/src/types.ts:1031](https://github.com/elizaos/eliza/blob/main/packages/core/src/types.ts#L1031)

---

### character

> **character**: [`Character`](../type-aliases/Character.md)

#### Defined in

[packages/core/src/types.ts:1032](https://github.com/elizaos/eliza/blob/main/packages/core/src/types.ts#L1032)

---

### providers

> **providers**: [`Provider`](Provider.md)[]

#### Defined in

[packages/core/src/types.ts:1033](https://github.com/elizaos/eliza/blob/main/packages/core/src/types.ts#L1033)

---

### actions

> **actions**: [`Action`](Action.md)[]

#### Defined in

[packages/core/src/types.ts:1034](https://github.com/elizaos/eliza/blob/main/packages/core/src/types.ts#L1034)

---

### evaluators

> **evaluators**: [`Evaluator`](Evaluator.md)[]

#### Defined in

[packages/core/src/types.ts:1035](https://github.com/elizaos/eliza/blob/main/packages/core/src/types.ts#L1035)

---

### plugins

> **plugins**: [`Plugin`](../type-aliases/Plugin.md)[]

#### Defined in

[packages/core/src/types.ts:1036](https://github.com/elizaos/eliza/blob/main/packages/core/src/types.ts#L1036)

---

### fetch()?

> `optional` **fetch**: (`input`, `init`?) => `Promise`\<`Response`\>

[MDN Reference](https://developer.mozilla.org/docs/Web/API/fetch)

#### Parameters

• **input**: `RequestInfo` \| `URL`

• **init?**: `RequestInit`

#### Returns

`Promise`\<`Response`\>

#### Defined in

[packages/core/src/types.ts:1038](https://github.com/elizaos/eliza/blob/main/packages/core/src/types.ts#L1038)

---

### messageManager

> **messageManager**: [`IMemoryManager`](IMemoryManager.md)

#### Defined in

[packages/core/src/types.ts:1040](https://github.com/elizaos/eliza/blob/main/packages/core/src/types.ts#L1040)

---

### descriptionManager

> **descriptionManager**: [`IMemoryManager`](IMemoryManager.md)

#### Defined in

[packages/core/src/types.ts:1041](https://github.com/elizaos/eliza/blob/main/packages/core/src/types.ts#L1041)

---

### documentsManager

> **documentsManager**: [`IMemoryManager`](IMemoryManager.md)

#### Defined in

[packages/core/src/types.ts:1042](https://github.com/elizaos/eliza/blob/main/packages/core/src/types.ts#L1042)

---

### knowledgeManager

> **knowledgeManager**: [`IMemoryManager`](IMemoryManager.md)

#### Defined in

[packages/core/src/types.ts:1043](https://github.com/elizaos/eliza/blob/main/packages/core/src/types.ts#L1043)

---

### loreManager

> **loreManager**: [`IMemoryManager`](IMemoryManager.md)

#### Defined in

[packages/core/src/types.ts:1044](https://github.com/elizaos/eliza/blob/main/packages/core/src/types.ts#L1044)

---

### cacheManager

> **cacheManager**: [`ICacheManager`](ICacheManager.md)

#### Defined in

[packages/core/src/types.ts:1046](https://github.com/elizaos/eliza/blob/main/packages/core/src/types.ts#L1046)

---

### services

> **services**: `Map`\<[`ServiceType`](../enumerations/ServiceType.md), [`Service`](../classes/Service.md)\>

#### Defined in

[packages/core/src/types.ts:1048](https://github.com/elizaos/eliza/blob/main/packages/core/src/types.ts#L1048)

---

### clients

> **clients**: `Record`\<`string`, `any`\>

any could be EventEmitter
but I think the real solution is forthcoming as a base client interface

#### Defined in

[packages/core/src/types.ts:1051](https://github.com/elizaos/eliza/blob/main/packages/core/src/types.ts#L1051)

## Methods

### initialize()

> **initialize**(): `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/core/src/types.ts:1053](https://github.com/elizaos/eliza/blob/main/packages/core/src/types.ts#L1053)

---

### registerMemoryManager()

> **registerMemoryManager**(`manager`): `void`

#### Parameters

• **manager**: [`IMemoryManager`](IMemoryManager.md)

#### Returns

`void`

#### Defined in

[packages/core/src/types.ts:1055](https://github.com/elizaos/eliza/blob/main/packages/core/src/types.ts#L1055)

---

### getMemoryManager()

> **getMemoryManager**(`name`): [`IMemoryManager`](IMemoryManager.md)

#### Parameters

• **name**: `string`

#### Returns

[`IMemoryManager`](IMemoryManager.md)

#### Defined in

[packages/core/src/types.ts:1057](https://github.com/elizaos/eliza/blob/main/packages/core/src/types.ts#L1057)

---

### getService()

> **getService**\<`T`\>(`service`): `T`

#### Type Parameters

• **T** _extends_ [`Service`](../classes/Service.md)

#### Parameters

• **service**: [`ServiceType`](../enumerations/ServiceType.md)

#### Returns

`T`

#### Defined in

[packages/core/src/types.ts:1059](https://github.com/elizaos/eliza/blob/main/packages/core/src/types.ts#L1059)

---

### registerService()

> **registerService**(`service`): `void`

#### Parameters

• **service**: [`Service`](../classes/Service.md)

#### Returns

`void`

#### Defined in

[packages/core/src/types.ts:1061](https://github.com/elizaos/eliza/blob/main/packages/core/src/types.ts#L1061)

---

### getSetting()

> **getSetting**(`key`): `string`

#### Parameters

• **key**: `string`

#### Returns

`string`

#### Defined in

[packages/core/src/types.ts:1063](https://github.com/elizaos/eliza/blob/main/packages/core/src/types.ts#L1063)

---

### getConversationLength()

> **getConversationLength**(): `number`

Methods

#### Returns

`number`

#### Defined in

[packages/core/src/types.ts:1066](https://github.com/elizaos/eliza/blob/main/packages/core/src/types.ts#L1066)

---

### processActions()

> **processActions**(`message`, `responses`, `state`?, `callback`?): `Promise`\<`void`\>

#### Parameters

• **message**: [`Memory`](Memory.md)

• **responses**: [`Memory`](Memory.md)[]

• **state?**: [`State`](State.md)

• **callback?**: [`HandlerCallback`](../type-aliases/HandlerCallback.md)

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/core/src/types.ts:1068](https://github.com/elizaos/eliza/blob/main/packages/core/src/types.ts#L1068)

---

### evaluate()

> **evaluate**(`message`, `state`?, `didRespond`?, `callback`?): `Promise`\<`string`[]\>

#### Parameters

• **message**: [`Memory`](Memory.md)

• **state?**: [`State`](State.md)

• **didRespond?**: `boolean`

• **callback?**: [`HandlerCallback`](../type-aliases/HandlerCallback.md)

#### Returns

`Promise`\<`string`[]\>

#### Defined in

[packages/core/src/types.ts:1075](https://github.com/elizaos/eliza/blob/main/packages/core/src/types.ts#L1075)

---

### ensureParticipantExists()

> **ensureParticipantExists**(`userId`, `roomId`): `Promise`\<`void`\>

#### Parameters

• **userId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

• **roomId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/core/src/types.ts:1082](https://github.com/elizaos/eliza/blob/main/packages/core/src/types.ts#L1082)

---

### ensureUserExists()

> **ensureUserExists**(`userId`, `userName`, `name`, `source`): `Promise`\<`void`\>

#### Parameters

• **userId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

• **userName**: `string`

• **name**: `string`

• **source**: `string`

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/core/src/types.ts:1084](https://github.com/elizaos/eliza/blob/main/packages/core/src/types.ts#L1084)

---

### registerAction()

> **registerAction**(`action`): `void`

#### Parameters

• **action**: [`Action`](Action.md)

#### Returns

`void`

#### Defined in

[packages/core/src/types.ts:1091](https://github.com/elizaos/eliza/blob/main/packages/core/src/types.ts#L1091)

---

### ensureConnection()

> **ensureConnection**(`userId`, `roomId`, `userName`?, `userScreenName`?, `source`?): `Promise`\<`void`\>

#### Parameters

• **userId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

• **roomId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

• **userName?**: `string`

• **userScreenName?**: `string`

• **source?**: `string`

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/core/src/types.ts:1093](https://github.com/elizaos/eliza/blob/main/packages/core/src/types.ts#L1093)

---

### ensureParticipantInRoom()

> **ensureParticipantInRoom**(`userId`, `roomId`): `Promise`\<`void`\>

#### Parameters

• **userId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

• **roomId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/core/src/types.ts:1101](https://github.com/elizaos/eliza/blob/main/packages/core/src/types.ts#L1101)

---

### ensureRoomExists()

> **ensureRoomExists**(`roomId`): `Promise`\<`void`\>

#### Parameters

• **roomId**: \`$\{string\}-$\{string\}-$\{string\}-$\{string\}-$\{string\}\`

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/core/src/types.ts:1103](https://github.com/elizaos/eliza/blob/main/packages/core/src/types.ts#L1103)

---

### composeState()

> **composeState**(`message`, `additionalKeys`?): `Promise`\<[`State`](State.md)\>

#### Parameters

• **message**: [`Memory`](Memory.md)

• **additionalKeys?**

#### Returns

`Promise`\<[`State`](State.md)\>

#### Defined in

[packages/core/src/types.ts:1105](https://github.com/elizaos/eliza/blob/main/packages/core/src/types.ts#L1105)

---

### updateRecentMessageState()

> **updateRecentMessageState**(`state`): `Promise`\<[`State`](State.md)\>

#### Parameters

• **state**: [`State`](State.md)

#### Returns

`Promise`\<[`State`](State.md)\>

#### Defined in

[packages/core/src/types.ts:1110](https://github.com/elizaos/eliza/blob/main/packages/core/src/types.ts#L1110)
