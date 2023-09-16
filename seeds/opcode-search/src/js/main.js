import { $, log } from './utils/dom.js'
import { highlighter } from './utils/highlighter.js'
import { settings } from './settings.js'

settings()

highlighter($('.row pre'))
log("Stop! better download the repository.\nhttps://github.com/MatiDragon-YT/page/tree/main/beta/opcode-search",
	"color: #F9F9F9;background-color: #16252c;font-size: 1rem;font-weight:bold;padding:.45rem 1rem"
)