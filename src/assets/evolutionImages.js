const svg = (title, subtitle, body) => `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="bg" cx="50%" cy="42%" r="72%">
      <stop offset="0" stop-color="#123450"/>
      <stop offset="52%" stop-color="#07111f"/>
      <stop offset="100%" stop-color="#02040a"/>
    </radialGradient>
    <linearGradient id="cy" x1="0" x2="1">
      <stop offset="0" stop-color="#7cf7ff"/>
      <stop offset="1" stop-color="#ffffff"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" x2="1">
      <stop offset="0" stop-color="#ffd86b"/>
      <stop offset="1" stop-color="#fff6b0"/>
    </linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="512" height="512" rx="42" fill="url(#bg)"/>
  <g opacity=".85" filter="url(#glow)">
    <path d="M47 112 L176 46 M392 60 L456 186 M65 391 L177 454 M333 457 L466 346" stroke="#7cf7ff" stroke-width="8" stroke-linecap="round"/>
    <path d="M98 64 L73 124 L119 107 L85 184" stroke="#ffd86b" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M431 76 L380 140 L435 128 L391 220" stroke="#ff6f9d" stroke-width="7" fill="none" stroke-linecap="round"/>
  </g>
  <circle cx="256" cy="290" r="174" fill="#07111f" opacity=".72" stroke="#7cf7ff" stroke-width="5"/>
  <circle cx="256" cy="290" r="124" fill="none" stroke="#ffd86b" stroke-width="4" opacity=".74"/>
  ${body}
  <rect x="32" y="32" width="448" height="72" rx="16" fill="#02040a" opacity=".88" stroke="#7cf7ff" stroke-width="3"/>
  <text x="50" y="65" fill="#ecfbff" font-family="system-ui, Segoe UI, sans-serif" font-size="25" font-weight="900">${title}</text>
  <text x="50" y="90" fill="#99bed0" font-family="system-ui, Segoe UI, sans-serif" font-size="14" font-weight="700">${subtitle}</text>
</svg>`)}`;

const egg = `
<g filter="url(#glow)">
  <ellipse cx="256" cy="286" rx="88" ry="126" fill="#dde6f6" stroke="#0a1020" stroke-width="11"/>
  <path d="M205 210 L240 242 L221 282 L264 319 L244 378" fill="none" stroke="#7cf7ff" stroke-width="12" stroke-linecap="round"/>
  <path d="M296 175 L273 229 L315 269 L292 337 L326 392" fill="none" stroke="#7cf7ff" stroke-width="10" stroke-linecap="round"/>
  <path d="M194 261 H318 M211 330 H304" stroke="url(#gold)" stroke-width="9" stroke-linecap="round"/>
  <circle cx="256" cy="338" r="31" fill="#07111f" stroke="#7cf7ff" stroke-width="11"/>
  <circle cx="256" cy="338" r="15" fill="#ecfbff"/>
</g>`;

const smallBeast = `
<g filter="url(#glow)">
  <path d="M163 320 Q208 206 290 234 Q377 270 361 356 Q300 414 210 386 Q172 369 163 320Z" fill="#dce7f6" stroke="#070b12" stroke-width="10"/>
  <path d="M202 228 L157 157 L232 197 M302 214 L374 154 L344 237" fill="#dce7f6" stroke="#070b12" stroke-width="10"/>
  <path d="M179 350 L134 404 M244 382 L218 440 M325 356 L382 420" stroke="#dce7f6" stroke-width="28" stroke-linecap="round"/>
  <path d="M179 350 L134 404 M244 382 L218 440 M325 356 L382 420" stroke="#07111f" stroke-width="8" stroke-linecap="round"/>
  <path d="M356 310 Q437 272 433 198" fill="none" stroke="#dce7f6" stroke-width="29" stroke-linecap="round"/>
  <path d="M356 310 Q437 272 433 198" fill="none" stroke="#7cf7ff" stroke-width="8" stroke-linecap="round"/>
  <circle cx="230" cy="286" r="16" fill="#7cf7ff"/><circle cx="300" cy="286" r="16" fill="#7cf7ff"/>
  <circle cx="258" cy="344" r="30" fill="#07111f" stroke="#7cf7ff" stroke-width="10"/><circle cx="258" cy="344" r="13" fill="#ecfbff"/>
  <path d="M129 168 h54 v54 h-54z" fill="none" stroke="#7cf7ff" stroke-width="8"/><path d="M144 183 h24 v24 h-24z" fill="none" stroke="#7cf7ff" stroke-width="5"/>
</g>`;

const proudBeast = `
<g filter="url(#glow)">
  <path d="M118 356 Q179 221 310 230 Q413 250 438 349 Q348 412 207 402 Q142 392 118 356Z" fill="#dce7f6" stroke="#05070c" stroke-width="11"/>
  <path d="M211 227 L173 149 L262 204 M300 222 L383 151 L353 245" fill="#dce7f6" stroke="#05070c" stroke-width="10"/>
  <path d="M198 251 L176 196 L243 226 M314 244 L362 194 L348 261" fill="url(#gold)"/>
  <path d="M172 375 L139 446 M249 390 L246 459 M346 382 L389 447" stroke="#dce7f6" stroke-width="33" stroke-linecap="round"/>
  <path d="M172 375 L139 446 M249 390 L246 459 M346 382 L389 447" stroke="#07111f" stroke-width="9" stroke-linecap="round"/>
  <path d="M385 312 Q468 235 438 135" fill="none" stroke="#dce7f6" stroke-width="30" stroke-linecap="round"/>
  <path d="M160 244 L128 202 M205 224 L181 167 M340 234 L389 190" stroke="url(#gold)" stroke-width="12" stroke-linecap="round"/>
  <circle cx="248" cy="289" r="15" fill="#7cf7ff"/><circle cx="310" cy="286" r="15" fill="#7cf7ff"/>
  <circle cx="282" cy="337" r="32" fill="#07111f" stroke="#7cf7ff" stroke-width="10"/>
</g>`;

const leapBeast = `
<g filter="url(#glow)">
  <path d="M113 346 Q195 184 338 214 Q440 254 422 344 Q307 395 185 392 Q131 381 113 346Z" fill="#dce7f6" stroke="#05070c" stroke-width="11"/>
  <path d="M197 216 L155 130 L268 199 M313 222 L391 133 L371 248" fill="#dce7f6" stroke="#05070c" stroke-width="10"/>
  <path d="M166 359 L70 421 M252 374 L212 470 M344 362 L460 422" stroke="#dce7f6" stroke-width="34" stroke-linecap="round"/>
  <path d="M166 359 L70 421 M252 374 L212 470 M344 362 L460 422" stroke="#07111f" stroke-width="9" stroke-linecap="round"/>
  <path d="M371 299 Q460 246 448 152" fill="none" stroke="#dce7f6" stroke-width="32" stroke-linecap="round"/>
  <path d="M149 243 L103 181 M217 219 L189 148 M299 209 L331 143 M366 245 L425 194" stroke="url(#gold)" stroke-width="13" stroke-linecap="round"/>
  <circle cx="250" cy="284" r="15" fill="#7cf7ff"/><circle cx="315" cy="288" r="15" fill="#7cf7ff"/>
  <path d="M60 420 h390 M110 390 h95 M330 397 h120" stroke="#7cf7ff" stroke-width="7" opacity=".8"/>
</g>`;

const beamBeast = `
<g filter="url(#glow)">
  <path d="M90 363 Q157 197 320 203 Q446 230 455 356 Q343 421 190 407 Q118 399 90 363Z" fill="#dce7f6" stroke="#05070c" stroke-width="11"/>
  <path d="M189 217 L142 132 L266 195 M307 209 L382 120 L368 240" fill="#dce7f6" stroke="#05070c" stroke-width="10"/>
  <path d="M150 371 L97 461 M244 394 L239 475 M356 372 L431 453" stroke="#dce7f6" stroke-width="36" stroke-linecap="round"/>
  <path d="M387 301 Q468 262 470 167" fill="none" stroke="#dce7f6" stroke-width="34" stroke-linecap="round"/>
  <path d="M154 250 L103 183 M210 220 L184 143 M288 204 L318 128 M360 238 L430 180" stroke="url(#gold)" stroke-width="14" stroke-linecap="round"/>
  <circle cx="277" cy="344" r="38" fill="#07111f" stroke="#7cf7ff" stroke-width="12"/>
  <path d="M328 302 L500 232" stroke="#7cf7ff" stroke-width="38" stroke-linecap="round"/><path d="M328 302 L500 232" stroke="#ffffff" stroke-width="13" stroke-linecap="round"/>
  <circle cx="235" cy="278" r="15" fill="#7cf7ff"/><circle cx="304" cy="276" r="15" fill="#7cf7ff"/>
</g>`;

const divineBeast = `
<g filter="url(#glow)">
  <circle cx="256" cy="291" r="202" fill="none" stroke="#7cf7ff" stroke-width="5" opacity=".55"/>
  <circle cx="97" cy="149" r="28" fill="#ffd86b"/><circle cx="432" cy="169" r="36" fill="#cdd7e8"/><circle cx="86" cy="407" r="31" fill="#7cf7ff"/><circle cx="390" cy="418" r="21" fill="#ffd86b"/>
  <path d="M97 365 Q153 174 320 196 Q449 229 451 349 Q352 430 189 413 Q118 405 97 365Z" fill="#dce7f6" stroke="#05070c" stroke-width="11"/>
  <path d="M200 202 L154 112 L270 184 M306 194 L375 96 L375 226" fill="#dce7f6" stroke="#05070c" stroke-width="10"/>
  <path d="M153 377 L104 463 M248 399 L238 482 M360 376 L432 454" stroke="#dce7f6" stroke-width="38" stroke-linecap="round"/>
  <path d="M382 304 Q463 252 458 151" fill="none" stroke="#dce7f6" stroke-width="35" stroke-linecap="round"/>
  <path d="M166 244 L120 174 M228 209 L209 119 M299 196 L330 105 M362 230 L426 164" stroke="url(#gold)" stroke-width="15" stroke-linecap="round"/>
  <circle cx="277" cy="345" r="42" fill="#07111f" stroke="#7cf7ff" stroke-width="13"/>
  <circle cx="240" cy="272" r="15" fill="#7cf7ff"/><circle cx="309" cy="270" r="15" fill="#7cf7ff"/>
</g>`;

export const phaseImages = {
  phase1: svg('01 // Huevo Núcleo', 'el origen de la bestia cibernética', egg),
  phase2: svg('02 // Cría Cableada', 'jugando con un paquete de datos', smallBeast),
  phase3: svg('03 // Cazador de Paquetes', 'postura orgullosa del nexo', proudBeast),
  phase4: svg('04 // Depredador Firewall', 'saltando sobre edificios cibernéticos', leapBeast),
  phase5: svg('05 // Titán Kernel', 'lanzando un rayo de energía', beamBeast),
  phase6: svg('06 // Bestia Divina', 'centro de un sistema solar digital', divineBeast)
};
