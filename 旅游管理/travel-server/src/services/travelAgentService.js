import TravelAgent from '../agent/travelAgent.js'

class TravelAgentService {
  constructor() {
    this.agent = new TravelAgent()
  }

  setLLM(llm) {
    this.agent.setLLM(llm)
  }

  async run(payload) {
    return this.agent.run(payload)
  }
}

export default new TravelAgentService()
