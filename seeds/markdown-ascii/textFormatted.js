const SP = String.prototype

SP.r = SP.replace
SP.rA = SP.replaceAll

const log = x => console.log(x)

SP.textFormatted = function(){
	const emojis = {
		left:'←',
		up:'↑',
		right:'→',
		down:'↓'
	}

	let abc = (
		'a,á,ä,b,c,d,e,é,ë,f,g,h,i,í,ï,j,k,l,m,n,ñ,o,ó,ö,p,q,r,s,t,u,ú,ü,v,w,x,y,z,'+
		'A,Á,Ä,B,C,D,E,É,Ë,F,G,H,I,Í,Ï,J,K,L,M,N,Ñ,O,Ó,Ö,P,Q,R,S,T,U,Ú,Ü,V,W,X,Y,Z'
	).split(',')
	
	let abcSimple = (
	  'abcdefghijklmnopqrstuvwxyz'+
	  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'+
	  '0123456789'
	).split('')

	let GOTHIC_H1 = (
		'𝖆,𝖆́,𝖆̈,𝖇,𝖈,𝖉,𝖊,𝖊́,𝖊̈,𝖋,𝖌,𝖍,𝖎,𝖎́,𝖎̈,𝖏,𝖐,𝖑,𝖒,𝖓,𝖓,𝖔,𝖔́,𝖔̈,𝖕,𝖖,𝖗,𝖘,𝖙,𝖚,𝖚́,𝖚̈,𝖛,𝖜,𝖝,𝖞,𝖟,'+
		'𝕬,𝕬́,𝕬̈,𝕭,𝕮,𝕯,𝕰,𝕰́,𝕰̈,𝕱,𝕲,𝕳,𝕴,𝕴́,𝕴̈,𝕵,𝕶,𝕷,𝕸,𝕹,𝕹,𝕺,𝕺́,𝕺̈,𝕻,𝕼,𝕽,𝕾,𝕿,𝖀,𝖀́,𝖀̈,𝖁,𝖂,𝖃,𝖄,𝖅'
	).split(',')

	let GOTHIC_H2 = (
		'𝔞,𝔞́,𝔞,𝔟,𝔠,𝔡,𝔢,𝔢́,𝔢,𝔣,𝔤,𝔥,𝔦,𝔦́,𝔦,𝔧,𝔨,𝔩,𝔪,𝔫,𝔫,𝔬,𝔬́,𝔬,𝔭,𝔮,𝔯,𝔰,𝔱,𝔲,𝔲́,𝔲,𝔳,𝔴,𝔵,𝔶,𝔷,'+
		'𝔄,𝔄́,𝔄,𝔅,ℭ,𝔇,𝔈,𝔈́,𝔈,𝔉,𝔊,ℌ,ℑ,ℑ́,ℑ,𝔍,𝔎,𝔏,𝔐,𝔑,𝔑,𝔒,𝔒́,𝔒,𝔓,𝔔,ℜ,𝔖,𝔗,𝔘,𝔘́,𝔘,𝔙,𝔚,𝔛,𝔜,ℨ'
	).split(',')

	let BOLD = (
		'𝗮,á,ä,𝗯,𝗰,𝗱,𝗲,é,ë,𝗳,𝗴,𝗵,𝗶,í,ï,𝗷,𝗸,𝗹,𝗺,𝗻,ñ,𝗼,ó,ö,𝗽,𝗾,𝗿,𝘀,𝘁,𝘂,ú,ü,𝘃,𝘄,𝘅,𝘆,𝘇,'+
		'𝗔,Á,Ä,𝗕,𝗖,𝗗,𝗘,É,Ë,𝗙,𝗚,𝗛,𝗜,Í,Ï,𝗝,𝗞,𝗟,𝗠,𝗡,Ñ,𝗢,Ó,Ö,𝗣,𝗤,𝗥,𝗦,𝗧,𝗨,Ú,Ü,𝗩,𝗪,𝗫,𝗬,𝗭'
	).split(',')

	let ITATIC = (
		'𝘢,á,ä,𝘣,𝘤,𝘥,𝘦,é,ë,𝘧,𝘨,𝘩,𝘪,í,ï,𝘫,𝘬,𝘭,𝘮,𝘯,ñ,𝘰,ó,ö,𝘱,𝘲,𝘳,𝘴,𝘵,𝘶,ú,ü,𝘷,𝘸,𝘹,𝘺,𝘻,'+
		'𝘈,Á,Ä,𝘉,𝘊,𝘋,𝘌,É,Ë,𝘍,𝘎,𝘏,𝘐,Í,Ï,𝘑,𝘒,𝘓,𝘔,𝘕,Ñ,𝘖,Ó,Ö,𝘗,𝘘,𝘙,𝘚,𝘛,𝘜,Ú,Ü,𝘝,𝘞,𝘟,𝘠,𝘡'
	).split(',')

	let ITATIC_BOLD = (
		'𝙖,á,ä,𝙗,𝙘,𝙙,𝙚,é,ë,𝙛,𝙜,𝙝,𝙞,í,ï,𝙟,𝙠,𝙡,𝙢,𝙣,ñ,𝙤,ó,ö,𝙥,𝙦,𝙧,𝙨,𝙩,𝙪,ú,ü,𝙫,𝙬,𝙭,𝙮,𝙯,'+
		'𝘼,Á,Ä,𝘽,𝘾,𝘿,𝙀,É,Ë,𝙁,𝙂,𝙃,𝙄,Í,Ï,𝙅,𝙆,𝙇,𝙈,𝙉,Ñ,𝙊,Ó,Ö,𝙋,𝙌,𝙍,𝙎,𝙏,𝙐,Ú,Ü,𝙑,𝙒,𝙓,𝙔,𝙕'
	).split(',')

	let HIGHTLIGHT = (
		'𝕒,á,ä,𝕓,𝕔,𝕕,𝕖,é,ë,𝕗,𝕘,𝕙,𝕚,í,ï,𝕛,𝕜,𝕝,𝕞,𝕟,ñ,𝕠,ó,ö,𝕡,𝕢,𝕣,𝕤,𝕥,𝕦,ú,ü,𝕧,𝕨,𝕩,𝕪,𝕫,'+
		'𝔸,Á,Ä,𝔹,ℂ,𝔻,𝔼,É,Ë,𝔽,𝔾,ℍ,𝕀,Í,Ï,𝕁,𝕂,𝕃,𝕄,ℕ,Ñ,𝕆,Ó,Ö,ℙ,ℚ,ℝ,𝕊,𝕋,𝕌,Ú,Ü,𝕍,𝕎,𝕏,𝕐,ℤ'
	).split(',')

	let MONOSPACE = (
		'𝚊,á,ä,𝚋,𝚌,𝚍,𝚎,é,ë,𝚏,𝚐,𝚑,𝚒,í,ï,𝚓,𝚔,𝚕,𝚖,𝚗,ñ,𝚘,ó,ö,𝚙,𝚚,𝚛,𝚜,𝚝,𝚞,ú,ü,𝚟,𝚠,𝚡,𝚢,𝚣,'+
		'𝙰,Á,Ä,𝙱,𝙲,𝙳,𝙴,É,Ë,𝙵,𝙶,𝙷,𝙸,Í,Ï,𝙹,𝙺,𝙻,𝙼,𝙽,Ñ,𝙾,Ó,Ö,𝙿,𝚀,𝚁,𝚂,𝚃,𝚄,Ú,Ü,𝚅,𝚆,𝚇,𝚈,𝚉'
	).split(',')

	let FULLSPACE = (
		'ａ,ｂ,ｃ,ｄ,ｅ,ｆ,ｇ,ｈ,ｉ,ｊ,ｋ,ｌ,ｍ,ｎ,ｏ,ｐ,ｑ,ｒ,ｓ,ｔ,ｕ,ｖ,ｗ,ｘ,ｙ,ｚ,'+
		'Ａ,Ｂ,Ｃ,Ｄ,Ｅ,Ｆ,Ｇ,Ｈ,Ｉ,Ｊ,Ｋ,Ｌ,Ｍ,Ｎ,Ｏ,Ｐ,Ｑ,Ｒ,Ｓ,Ｔ,Ｕ,Ｖ,Ｗ,Ｘ,Ｙ,Ｚ,'+
		'０,１,２,３,４,５,６,７,８,９'
	).split(',')
	
	let TITLE = (
   '𝐚,𝐛,𝐜,𝐝,𝐞,𝐟,𝐠,𝐡,𝐢,𝐣,𝐤,𝐥,𝐦,𝐧,𝐨,𝐩,𝐪,𝐫,𝐬,𝐭,𝐮,𝐯,𝐰,𝐱,𝐲,𝐳,'+
   '𝐀,𝐁,𝐂,𝐃,𝐄,𝐅,𝐆,𝐇,𝐈,𝐉,𝐊,𝐋,𝐌,𝐍,𝐎,𝐏,𝐐,𝐑,𝐒,𝐓,𝐔,𝐕,𝐖,𝐗,𝐘,𝐙,'+
   '𝟎,𝟏,𝟐,𝟑,𝟒,𝟓,𝟔,𝟕,𝟖,𝟗'
	).split(',')
	
	log(FULLSPACE)

	//Array.from("Hello, World!").forEach((e, i) => console.log(e, i));

	let inputString = this
		
		/*** FORMAT ***/
		.r(/\*\*\*([^\*\n]+)\*\*\*/g, input => {
			input = input.r(/\*\*\*([^\*\n]+)\*\*\*/, '$1')

			ITATIC_BOLD.forEach((x, p) => {
				input = input.r(new RegExp(abc[p], 'g'), x)
			})
			return input
		})
		.r(/\*\*([^\*\n]+)\*\*/g, input => {
			input = input.r(/\*\*([^\*\n]+)\*\*/, '$1')

			BOLD.forEach((x, p) => {
				input = input.r(new RegExp(abc[p], 'g'), x)
			})
			return input
		})

		.r(/\*([^\*\n]+)\*/g, input => {
			input = input.r(/\*([^\*\n]+)\*/, '$1')

			ITATIC.forEach((x, p) => {
				input = input.r(new RegExp(abc[p], 'g'), x)
			})
			return input
		})

		.r(/`([^\n`]*)`/g, input => {
			input = input.r(/`([^\n`]+)`/, '[ $1 ]')

			MONOSPACE.forEach((x, p) => {
				input = input.r(new RegExp(abc[p], 'g'), x)
			})
			return input
		})

		.r(/=([^\n=]*)=/g, input => {
			input = input.r(/=([^\n=]+)=/, '$1')

			HIGHTLIGHT.forEach((x, p) => {
				input = input.r(new RegExp(abc[p], 'g'), x)
			})
			return input
		})

		.r(/\{u(.+)u\}/g, input => {
			input = input.r(/\{u(.+)u\}/, '$1').trim()

			FULLSPACE.forEach((x, p) => {
				input = input.r(new RegExp(abcSimple[p], 'g'), x)
			})
			return input
		})
		
		.r(/"([^"]*)"/g, '“$1”')
		.r(/'([^']*)'/g, '‘$1’')

		.r(/^> /gm, '▌ ')
		.rA('<-', '←')
		.rA('->', '→')
		.rA('<', '≺')
		.rA('>', '≻')

		.r(/^---+$/gm,'▔▔▔▔▔▔▔▔▔▔')
		.r(/^===+$/gm,'▬▬▬▬▬▬▬▬▬▬')

		/*** TITLE ***/
		.r(/^# (.+)$/gmi, input => {
			BOLD.forEach((x, p) => {
				input = input.r(new RegExp(abc[p], 'g'), x)
			})
			return input.r('#','▶')
		})
		.r(/^## (.+)$/gmi, input => {
			BOLD.forEach((x, p) => {
				input = input.r(new RegExp(abc[p], 'g'), x)
			})
			return input.r('##','▷')
		})
		.r(/^### (.+)$/gmi, input => {
			TITLE.forEach((x, p) => {
				input = input.r(new RegExp(abcSimple[p], 'g'), x)
			})
			return input.r('###','▓')
		})
		.r(/^####+ (.+)$/gmi, input => {
			TITLE.forEach((x, p) => {
			  input = input.r(new RegExp(abcSimple[p], 'g'), x)
			})
			return input.r(/####+/,'▒')
		})

	return inputString
}

//log(0b10)
function Lerp(start_value, end_value, pct) {
   return (start_value + (end_value - start_value) * pct)
}

//log(Lerp(0, 20, 0.2))

//log(255 * 5.702)
/*
let time = 0; //Current time or progress
let duration = 4; //Animation time
let init = 0
while(time<=duration) //inside this loop until the time expires
{
	init = Lerp(init, 10, time/duration)
  log(init)

  //Wait 1 millisecond, depends on your language

  time += 1; //Adds one millisecond to the elapsed time
}
*/