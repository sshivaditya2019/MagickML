import Rete from 'rete'
import {
  NodeData,
  MagickNode,
  MagickWorkerInputs,
  MagickWorkerOutputs,
  QAArgs,
  triggerSocket,
  anySocket,
  stringSocket,
  MagickComponent,
  API_URL
} from 'packages/engine/src/index'
const info = 'Event Q&A is used for getting answers to questions based on the events stored.'

type WorkerReturn = {
  output: string
}

export class EventQA extends MagickComponent<Promise<WorkerReturn>>{
  constructor() {
    super('Event QA')
    this.task = {
      outputs: {
        output: 'output',
        trigger: 'option'
      },
    }

    this.category = 'Events'
    this.display = true
    this.info = info
    this.runFromCache = true
  }

  builder(node: MagickNode) {
    const idInput = new Rete.Input('question', 'Question', anySocket)
    const agentidInput = new Rete.Input('agentId', 'Agent ID', stringSocket)
    const dataInput = new Rete.Input('trigger', 'Tirgger', triggerSocket, true)
    const dataOutput = new Rete.Output('trigger', 'Trigger', triggerSocket)
    const output = new Rete.Output('output', 'Output', anySocket)
    return node
      .addInput(idInput)
      .addInput(agentidInput)
      .addInput(dataInput)
      .addOutput(dataOutput)
      .addOutput(output)
  }

  async worker(
    node: NodeData,
    inputs: MagickWorkerInputs,
    _outputs: MagickWorkerOutputs,
  ) {

    const eventQAWeaviate = async ({
      question, agentId
    }: QAArgs) => {
      const params = {
        question,
        agentId
      } as Record<string, any>
      const urlString = `${
        API_URL
      }/EventsQA`
        
      const url = new URL(urlString)
      for (let p in params) {
        url.searchParams.append(p, params[p])
      }

      const response = await fetch(url.toString()).then(response => response.json())
      return response
    }

    const question = inputs['question'][0] as string
    const agentId = (inputs['agentId'] && inputs['agentId'][0]) as string
    const body = {
      question,
      agentId
    }
    const response = await eventQAWeaviate(body)
    var result
    if (!(response['_additional']['answer']['hasAnswer'])) {
      result = "No Mathching events found"
    } else {
      result = response['_additional']['answer']['result']
    }
    return {
      output: result
    }
  }
}