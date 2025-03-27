import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env['GEMINI_API_KEY']; // Get API key from environment
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });



const latinText = "Suffrutex diffusus decumbens in pleiochasium ramosus primo\
 floccoso-arachnoideus mox glabrescens; rami parum lignescentes \
 subgraciles 1-2 mm crassi nervo medio foliorum decurrenti angulati \
 vel angustissime alati usque 5 dm longi, internodiis 0.5-2(-4) cm longis. \
 Folia alterna subcoriacea oblanceolata vel summa sublinearia semiamplexicaulia \
 sessilia vel basin versus in petiolum angustata petiolo incluso 2-7 cm \
 longa 0.3-2.5 cm lata apice acuta interdum mucronulata margine integerrima \
 leviter cartilaginea; nervus medius albidus subtus prominens, nervi \
 longitudinales plerumque duo in foliis inferioribus conspicui. Capitula \
 in apicibus ramulorum solitaria pedunculata; pedunculi graciles 1-2 cm \
 longi irregulariter curvati saepe reclinati bracteis paucis \
 lineari-subulatis 2-8 mm longis instructi. Involucrum campanulatum 5-6 mm \
 altum; squamae imbricatae 2-3seriatae acuto-acuminatae, exteriores \
 fere lineares dorso parce hirtae margine laeves cartilagineae 3-4 mm \
 longae, interiores lanceolatae dense hirtae margine scariosae ciliatae \
 5-6 mm longae c. 1.5 mm latae. Flores radii c. 8; ligulae flavae involucrum \
 non vel vix superantes; flores disci flavi involucro c. 2 mm breviores. \
 Achaenia glabra laevia obovoideo-cylindracea c. 4 mm longa c. 1.5-2 mm diam."

const prompt = "Translate to formal botanical english: " + latinText;

//const prompt = "Translate to common english: " + latinText;

async function generateContent() {
    const result = await model.generateContent(prompt);
    console.log(result.response.text());
    console.log("\n\n")
}

generateContent();
