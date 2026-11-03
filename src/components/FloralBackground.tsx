// Decorative watercolor-style flowers. Purely visual, hidden from screen readers.
export function FloralBackground() {
  return (
    <div className="home-floral" aria-hidden="true">
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <g id="hf-poppy">
            <g fill="#F7DC94" fillOpacity=".82" stroke="#EFC76A" strokeOpacity=".5" strokeWidth="1.5">
              {[0, 60, 120, 180, 240, 300].map((r) => (
                <ellipse key={r} cx="100" cy="55" rx="36" ry="50" transform={`rotate(${r} 100 100)`} />
              ))}
            </g>
            <circle cx="100" cy="100" r="30" fill="#F4B993" fillOpacity=".45" />
            <circle cx="100" cy="100" r="17" fill="#6E4C36" />
            <circle cx="100" cy="100" r="9" fill="#3E2B20" />
          </g>
          <g id="hf-fmn">
            <g fill="#A5C0EC" stroke="#8AA8DE" strokeWidth="1">
              {[0, 72, 144, 216, 288].map((r) => (
                <circle key={r} cx="30" cy="14" r="11" transform={`rotate(${r} 30 30)`} />
              ))}
            </g>
            <circle cx="30" cy="30" r="5" fill="#F4D56C" />
          </g>
          <path id="hf-leaf" d="M0 0C20-26 62-26 90 0C62 26 20 26 0 0Z" fill="#A9B99C" fillOpacity=".85" />
        </defs>
      </svg>

      <div className="hf hf-a">
        <svg viewBox="0 0 360 520">
          <path d="M70 520C80 420 100 330 170 230" stroke="#9AAB8D" strokeWidth="4" fill="none" strokeLinecap="round" />
          <use href="#hf-leaf" transform="translate(88 400) rotate(-50) scale(.9)" />
          <use href="#hf-leaf" transform="translate(110 340) rotate(20) scale(.7)" />
          <use href="#hf-poppy" transform="translate(10 20) scale(1.3)" />
          <use href="#hf-poppy" transform="translate(90 170) scale(.8)" />
          <use href="#hf-fmn" transform="translate(0 300) scale(1.1)" />
          <use href="#hf-fmn" transform="translate(40 380) scale(.8)" />
        </svg>
      </div>
      <div className="hf hf-b">
        <svg viewBox="0 0 300 420">
          <path d="M230 420C220 330 215 240 190 150" stroke="#9AAB8D" strokeWidth="4" fill="none" strokeLinecap="round" />
          <use href="#hf-leaf" transform="translate(225 330) rotate(-140) scale(.7)" />
          <use href="#hf-fmn" transform="translate(150 20) scale(1.2)" />
          <use href="#hf-fmn" transform="translate(220 90)" />
          <use href="#hf-fmn" transform="translate(120 120) scale(.9)" />
          <use href="#hf-fmn" transform="translate(190 200) scale(.9)" />
          <use href="#hf-fmn" transform="translate(240 10) scale(.8)" />
        </svg>
      </div>
      <div className="hf hf-c">
        <svg viewBox="0 0 280 330">
          <path d="M180 250C170 290 175 310 180 330" stroke="#9AAB8D" strokeWidth="4" fill="none" strokeLinecap="round" />
          <use href="#hf-leaf" transform="translate(20 300) rotate(-70)" />
          <use href="#hf-leaf" transform="translate(40 330) rotate(-100) scale(.9)" />
          <use href="#hf-poppy" transform="translate(70 30) scale(1.1)" />
        </svg>
      </div>
      <div className="hf hf-d">
        <svg viewBox="0 0 280 300">
          <use href="#hf-leaf" transform="translate(40 300) rotate(-80)" />
          <use href="#hf-leaf" transform="translate(40 300) rotate(-55) scale(.9)" />
          <use href="#hf-leaf" transform="translate(40 300) rotate(-100) scale(.8)" />
          <use href="#hf-poppy" transform="translate(30 80) scale(.7)" />
        </svg>
      </div>
    </div>
  );
}
