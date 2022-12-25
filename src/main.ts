import './style.scss'
import RL from "./rl";

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <vt-rl></vt-rl>
`

customElements.define('vt-rl', RL);
