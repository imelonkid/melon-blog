---
title: OpenAI API汇总(持续更新)
date: 2023-04-02 23:33:48
tags: [OpenAI, ChatGPT, "人工智能"]
---

## openAI API汇总
由于OPENAI网站暂不对中国开放，API文档不方便查看。所以我Copy一份过来，并对部分API做了中文翻译。

OpenAI API 提供访问多种语言模型，这些模型具备不同的能力和价格选项。这些模型包括GPT-3模型，以其能够在各种任务中生成高质量、类人的语言而闻名，还包括为特定用例优化的较小模型。
除了预训练模型之外，您还可以使用微调来定制基础模型以满足您的特定需求。微调包括在特定数据集上训练模型，以提高其在特定任务上的性能。如果您有特定的用例需要模型从特定数据中学习或执行特定任务，这种方法可能非常有用。
OpenAI API 还提供了一系列工具和资源，以帮助开发人员开始微调，包括文档、代码示例和来自OpenAI团队的支持。

|MODELS	|DESCRIPTION|
|--|--|
|GPT-4 Limited beta| A set of models that improve on GPT-3.5 and can understand as well as generate natural language or code|
|GPT-3.5|A set of models that improve on GPT-3 and can understand as well as generate natural language or code|
|DALL·EBeta|	A model that can generate and edit images given a natural language prompt|
|WhisperBeta|	A model that can convert audio into text|
|Embeddings|	A set of models that can convert text into a numerical form|
|Moderation|	A fine-tuned model that can detect whether text may be sensitive or unsafe|
|GPT-3|	A set of models that can understand and generate natural language|
|CodexDeprecated|	A set of models that can understand and generate code, including translating natural language to code|
OpenAI还提供了一系列开源的模型，如： Point-E, Whisper, Jukebox, and CLIP.


|API|URL|type|说明|
|--|--|--|--|
|list models|https://api.openai.com/v1/models | GET | 查询当前可用的模型列表，只包含基础信息|
|Retrieve model|https://api.openai.com/v1/models/{model}| GET |获取指定模型的详细信息 |


```python
import requests
headers = {
"Authorization": "Bearer ${APP_KEY}",
}

## 获取model列表
url = "https://api.openai.com/v1/models" 
# response = requests.get(url, headers=headers).text
print(response)

## 获取指定model详细信息
url = "https://api.openai.com/v1/models/{model}" 
# response = requests.get(url, headers=headers).text
print(response)
```


### Completions(补全)
OpenAI的Completion是一种人工智能技术，它可以根据给定的输入文本自动生成相应的补全文本。这种技术可以用于自动生成文章、回答问题、完成句子或段落等任务。Completion是一种基于大规模语言模型的自然语言处理技术，它可以学习大量的语言知识，并根据输入的上下文和语言规则生成合理的补全文本。

#### 接口列表
|API|URL|type|说明|
|--|--|--|--|
|Create Completion|https://api.openai.com/v1/completions | POST | 创建一个文本补全 |

----

#### 参数列表
|参数|是否必填|说明|
|--|--|--|
|model|是 | 训练模型 | 创建一个文本补全 |
|prompt|否| 需要生成补全文本的提示信息，可以被编码为字符串、字符串数组、令牌数组或令牌数组的数组。 |获取指定模型的详细信息 |
|suffix|否|插入文本完成后的后缀|
|max_tokens|否|默认值16；通过将文本拆解成Token来理解和处理文本，Token可以是单词或则只是字符串。<br/> 例如，单词”hamburger“被分解为”ham“、”bur“、”ger“; 而像”pear“这样的短而常见的单词是一个Token。<br/> 作为一个粗略的规则，一个Token大约是4个字符或则0.75个单词的英文文本。对于大多数的模型，支持的Token上限是2048，大约1500个单词。最新的模型可能支持4096个Token|
|temperature|否|默认值1；使用哪个采样温度，在0到2之间。较高的值（如0.8）会使输出更随机，而较低的值（如0.2）会使其更加聚焦和确定性。<br/>我们通常建议修改其中一个参数，要么是采样温度，要么是top_p，而不是两个都修改。|
|top_p|否|默认值1； An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered.|
|n|否|默认值1；对于给定的提示响应的补全个数|
|stream|否| 默认值:false， 以流式的方式返回数据 |
|logprobs|否|默认值: null，在logprobs最可能的标记中包含对数概率以及所选择的标记。例如，如果logprobs为5，则API将返回一个由5个最可能标记组成的列表。API将始终返回所抽样标记的logprob，因此响应中可能有多达logprobs+1个元素。<br/> logprobs的最大值为5。如果您需要更多，请通过我们的帮助中心与我们联系并描述您的用例。|
|echo|否|默认值:false；是否返回提示|
|stop|否|默认值:null；API一次最多返回四个段落，在返回的文本中不包含停止锻炼|
|presence_penalty|否|默认值:0; Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.|
|frequency_penalty| 否 | 默认值:0 Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.|
|best_of|否|默认值:1;最佳响应补全个数，可以配合参数n使用，其中best_of要大于n|
|logit_bias|否|默认值:null;Modify the likelihood of specified tokens appearing in the completion.<br/>
Accepts a json object that maps tokens (specified by their token ID in the GPT tokenizer) to an associated bias value from -100 to 100. You can use this tokenizer tool (which works for both GPT-2 and GPT-3) to convert text to token IDs. Mathematically, the bias is added to the logits generated by the model prior to sampling. The exact effect will vary per model, but values between -1 and 1 should decrease or increase likelihood of selection; values like -100 or 100 should result in a ban or exclusive selection of the relevant token.<br/>As an example, you can pass {"50256": -100} to prevent the <|endoftext|> token from being generated.|
|user|否|用户的个人标识，可以帮助OpenAI监控和服务乱用|


### Chat
与Completion类似，但是使用场景不一样；Chat通常指与一个聊天伙伴进行交流的过程。在这个过程中，聊天伙伴可以是人类或机器人。Chat的目的通常是进行社交互动、沟通交流、获取信息、寻求帮助等。
Completion指利用机器学习模型自动生成一些内容，例如生成文本、图像、音频等。Completion模型通常需要一个输入，比如一些文字，然后模型会根据输入的内容来生成新的内容。Completion模型常常用于文本自动补全、文章摘要、语音识别、图像描述等应用场景。与Chat不同，Completion通常是与机器互动，目的是为了自动化生成一些内容。
#### 接口列表
|API|URL|type|说明|
|--|--|--|--|
|Create Chat|https://api.openai.com/v1/chat/completions | POST | 创建一个会话，Content-Type: application/json"，"Authorization: Bearer $OPENAI_API_KEY" |
参数与Completion类似


### Edit
根据给定的说明，返回修改会的提示
#### 接口列表
|API|URL|type|说明|
|--|--|--|--|
|Create Edit|https://api.openai.com/v1/edits | POST | 创建一个会话，Content-Type: application/json"，"Authorization: Bearer $OPENAI_API_KEY" |

#### 参数列表
|参数|是否必填|说明|
|--|--|--|
|model|是 | 训练模型，创建一个文本补全 |
|input|否 | 默认值:""; 需要修改的文本 | 
|instruction|是 | 修改说明 | 
|n|否 | 默认值:1； 返回条数 | 
|temperature、top_p|否 | 与Completion类似 | 

```json
### request
{
  "model": "text-davinci-edit-001",
  "input": "What day of the wek is it?",
  "instruction": "Fix the spelling mistakes",
}

### response
{
  "object": "edit",
  "created": 1589478378,
  "choices": [
    {
      "text": "What day of the week is it?",
      "index": 0,
    }
  ],
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 32,
    "total_tokens": 57
  }
}
```

### Image
提供提示(或则一个图片)，模型响应一个新的图片
#### 接口列表
|API|URL|type|说明|
|--|--|--|--|
|Create Image|https://api.openai.com/v1/images/generations | POST | 创建一个会话，Content-Type: application/json"，"Authorization: Bearer $OPENAI_API_KEY" |
|Create image edit|https://api.openai.com/v1/images/edits | POST | Creates an edited or extended image given an original image and a prompt.|
|Create image variation|https://api.openai.com/v1/images/variations | POST | Creates a variation of a given image. |


#### 参数列表
Create Image
|参数|是否必填|说明|
|--|--|--|
|prompt|是 | 图片的描述，最大1k字符 |
|size|否 | 默认值:"1024*1024"; 生成图片的大小 | 
|response_format|否 |生成拖的格式，url或则是b64_json | 
|user|否 | 与Completion类似 | 



