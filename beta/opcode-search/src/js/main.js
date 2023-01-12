import { $, log } from './utils/dom.js'
import { highlighter } from './utils/highlighter.js'
import { settings } from './settings.js'

settings()

highlighter($('.row pre'))
log("Stop! better download the repository.\nhttps://github.com/MatiDragon-YT/opcode-search",
	"color: black;background-color: #4caf50;font-size: 1rem;font-weight:bold;padding:.45rem 1rem"
)