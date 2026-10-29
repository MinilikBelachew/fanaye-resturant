import React from "react";

export function TomatoCartoon({
    className = "size-20",
}: {
    className?: string;
}) {
    return (
        <svg
            viewBox="0 0 100 100"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Ground shadow */}
            <ellipse
                cx="50"
                cy="88"
                rx="34"
                ry="7"
                fill="#000"
                fillOpacity="0.25"
            />
            {/* Tomato Body */}
            <circle cx="50" cy="54" r="32" fill="#E23E3E" />
            <circle cx="48" cy="52" r="30" fill="#EB4D4B" />
            {/* Highlight */}
            <path
                d="M32 36C38 30 46 28 50 28C44 32 40 40 40 48C40 49 40 50 39.9 51C35.9 49 33 43 32 36Z"
                fill="#FF7675"
                fillOpacity="0.6"
            />
            <ellipse
                cx="37"
                cy="42"
                rx="4"
                ry="7"
                transform="rotate(-30 37 42)"
                fill="#FFFFFF"
                fillOpacity="0.35"
            />
            {/* Calyx & Stem */}
            <path
                d="M50 26C50 18 53 14 58 12C57 16 55 22 52 26H50Z"
                fill="#2ED573"
            />
            <path
                d="M50 26L42 18L44 26L34 27L43 31L38 38L47 33L50 41L53 33L62 38L57 31L66 27L56 26L58 18L50 26Z"
                fill="#26AF61"
            />
        </svg>
    );
}

export function OrangeCartoon({
    className = "size-20",
}: {
    className?: string;
}) {
    return (
        <svg
            viewBox="0 0 100 100"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <ellipse
                cx="50"
                cy="88"
                rx="32"
                ry="7"
                fill="#000"
                fillOpacity="0.25"
            />
            {/* Fruit body */}
            <circle cx="50" cy="52" r="32" fill="#E67E22" />
            <circle cx="48" cy="50" r="30" fill="#F39C12" />
            <circle cx="46" cy="48" r="28" fill="#F8B42C" />
            {/* Shine */}
            <ellipse
                cx="36"
                cy="38"
                rx="5"
                ry="9"
                transform="rotate(-30 36 38)"
                fill="#FFF"
                fillOpacity="0.3"
            />
            {/* Stem & Leaf */}
            <path
                d="M50 22C49 16 51 12 55 10"
                stroke="#795548"
                strokeWidth="3"
                strokeLinecap="round"
            />
            <path
                d="M52 18C60 14 68 18 72 23C66 26 58 24 52 18Z"
                fill="#2ECC71"
            />
            <path
                d="M54 18C60 19 66 21 72 23"
                stroke="#27AE60"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </svg>
    );
}

export function HerbsCartoon({
    className = "size-20",
}: {
    className?: string;
}) {
    return (
        <svg
            viewBox="0 0 100 100"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <ellipse
                cx="50"
                cy="88"
                rx="30"
                ry="6"
                fill="#000"
                fillOpacity="0.25"
            />
            {/* Stems */}
            <path
                d="M38 78L48 40"
                stroke="#27AE60"
                strokeWidth="3"
                strokeLinecap="round"
            />
            <path
                d="M44 80L49 38"
                stroke="#2ECC71"
                strokeWidth="3"
                strokeLinecap="round"
            />
            <path
                d="M50 82L50 36"
                stroke="#27AE60"
                strokeWidth="3.5"
                strokeLinecap="round"
            />
            <path
                d="M56 80L51 38"
                stroke="#2ECC71"
                strokeWidth="3"
                strokeLinecap="round"
            />
            <path
                d="M62 78L52 40"
                stroke="#27AE60"
                strokeWidth="3"
                strokeLinecap="round"
            />
            {/* Tie / Wrap */}
            <rect x="42" y="66" width="16" height="8" rx="2" fill="#D3A264" />
            <rect x="43" y="68" width="14" height="2" fill="#B58347" />
            {/* Leafy Heads */}
            <circle cx="28" cy="28" r="9" fill="#2ECC71" />
            <circle cx="38" cy="22" r="10" fill="#27AE60" />
            <circle cx="50" cy="18" r="11" fill="#2ECC71" />
            <circle cx="62" cy="22" r="10" fill="#27AE60" />
            <circle cx="72" cy="28" r="9" fill="#2ECC71" />
            <circle cx="34" cy="34" r="8" fill="#229954" />
            <circle cx="46" cy="30" r="9" fill="#2ECC71" />
            <circle cx="56" cy="30" r="9" fill="#229954" />
            <circle cx="66" cy="34" r="8" fill="#27AE60" />
        </svg>
    );
}

export function PotatoesCartoon({
    className = "size-20",
}: {
    className?: string;
}) {
    return (
        <svg
            viewBox="0 0 100 100"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <ellipse
                cx="50"
                cy="86"
                rx="38"
                ry="7"
                fill="#000"
                fillOpacity="0.25"
            />
            {/* Potato 1 (Left, slightly back) */}
            <ellipse cx="38" cy="54" rx="22" ry="18" fill="#B3874B" />
            <ellipse cx="36" cy="53" rx="20" ry="16" fill="#C4975A" />
            <circle cx="28" cy="48" r="1.5" fill="#8C632C" />
            <circle cx="35" cy="58" r="1.5" fill="#8C632C" />
            <circle cx="44" cy="46" r="1.5" fill="#8C632C" />
            {/* Potato 2 (Right, front) */}
            <ellipse cx="62" cy="58" rx="24" ry="19" fill="#B3874B" />
            <ellipse cx="60" cy="57" rx="22" ry="17" fill="#D4A76A" />
            <circle cx="52" cy="52" r="1.5" fill="#8C632C" />
            <circle cx="60" cy="64" r="1.5" fill="#8C632C" />
            <circle cx="68" cy="54" r="1.5" fill="#8C632C" />
            <circle cx="74" cy="62" r="1.5" fill="#8C632C" />
            <ellipse
                cx="54"
                cy="48"
                rx="6"
                ry="2"
                transform="rotate(-15 54 48)"
                fill="#FFF"
                fillOpacity="0.25"
            />
        </svg>
    );
}

export function MeatCartoon({ className = "size-20" }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 100 100"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <ellipse
                cx="50"
                cy="86"
                rx="36"
                ry="7"
                fill="#000"
                fillOpacity="0.25"
            />
            {/* Meat Outer Fat Ring */}
            <path
                d="M24 50C22 34 36 24 54 24C72 24 84 36 80 54C76 72 62 78 44 78C26 78 26 66 24 50Z"
                fill="#F8ECE8"
            />
            {/* Red Meat Center */}
            <path
                d="M28 50C26 38 38 28 54 28C68 28 76 38 74 52C72 66 60 72 46 72C32 72 30 62 28 50Z"
                fill="#C0392B"
            />
            <path
                d="M32 50C30 40 40 32 54 32C64 32 70 40 68 50C66 60 56 66 46 66C36 66 34 60 32 50Z"
                fill="#D94534"
            />
            {/* White Marbling waves */}
            <path
                d="M36 46C42 44 48 48 54 46C60 44 64 42 66 44"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeOpacity="0.75"
            />
            <path
                d="M38 56C44 54 48 58 56 56C60 54 62 56 64 56"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeOpacity="0.75"
            />
        </svg>
    );
}

export const BeefCartoon = MeatCartoon;

export function FishCartoon({ className = "size-20" }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 100 100"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <ellipse
                cx="50"
                cy="86"
                rx="36"
                ry="6"
                fill="#000"
                fillOpacity="0.25"
            />
            {/* Tail Fin */}
            <path d="M72 50L90 32V68L72 50Z" fill="#7F8C8D" />
            {/* Dorsal Fin */}
            <path d="M42 34C48 24 58 24 64 34Z" fill="#7F8C8D" />
            {/* Fish Body */}
            <ellipse cx="48" cy="50" rx="32" ry="20" fill="#95A5A6" />
            <ellipse cx="46" cy="49" rx="30" ry="18" fill="#BDC3C7" />
            {/* Gills and Stripes */}
            <path
                d="M34 38C38 44 38 56 34 62"
                stroke="#7F8C8D"
                strokeWidth="2.5"
                strokeLinecap="round"
            />
            <path
                d="M44 36C48 42 48 58 44 64"
                stroke="#7F8C8D"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <path
                d="M54 36C58 42 58 58 54 64"
                stroke="#7F8C8D"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <path
                d="M64 40C67 44 67 56 64 60"
                stroke="#7F8C8D"
                strokeWidth="2"
                strokeLinecap="round"
            />
            {/* Eye */}
            <circle cx="24" cy="46" r="4.5" fill="#FFFFFF" />
            <circle cx="23" cy="46" r="2.5" fill="#2C3E50" />
            <circle cx="22" cy="45" r="1" fill="#FFFFFF" />
        </svg>
    );
}

export function SpicesCartoon({
    className = "size-20",
}: {
    className?: string;
}) {
    return (
        <svg
            viewBox="0 0 100 100"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <ellipse
                cx="50"
                cy="86"
                rx="34"
                ry="7"
                fill="#000"
                fillOpacity="0.25"
            />
            {/* Spice Mound (Berbere) */}
            <path
                d="M24 60C24 40 36 32 50 32C64 32 76 40 76 60Z"
                fill="#B03A2E"
            />
            <path
                d="M28 58C28 42 38 36 50 36C62 36 72 42 72 58Z"
                fill="#D94534"
            />
            {/* Bowl */}
            <path
                d="M18 56C18 78 32 84 50 84C68 84 82 78 82 56H18Z"
                fill="#F4EAE1"
            />
            <path
                d="M20 56C20 74 34 80 50 80C66 80 80 74 80 56H20Z"
                fill="#FAF6F0"
            />
            <ellipse cx="50" cy="56" rx="32" ry="6" fill="#E8D5C4" />
        </svg>
    );
}

export function ReadyToCookCartoon({
    className = "size-20",
}: {
    className?: string;
}) {
    return (
        <svg
            viewBox="0 0 100 100"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <ellipse
                cx="50"
                cy="86"
                rx="38"
                ry="7"
                fill="#000"
                fillOpacity="0.25"
            />
            {/* Plate */}
            <ellipse cx="46" cy="62" rx="36" ry="16" fill="#E5E8E8" />
            <ellipse cx="46" cy="61" rx="33" ry="14" fill="#FFFFFF" />
            {/* Pasta Nest */}
            <path
                d="M26 62C30 54 44 50 56 52C64 54 68 62 64 66C60 70 38 72 26 62Z"
                fill="#F9E79F"
            />
            <path
                d="M22 64C30 68 46 72 62 66"
                stroke="#F4D03F"
                strokeWidth="3"
                strokeLinecap="round"
            />
            {/* Red Sauce & Leaf */}
            <circle cx="48" cy="58" r="8" fill="#E74C3C" />
            <path
                d="M46 54C46 50 49 48 53 49C52 52 50 54 46 54Z"
                fill="#2ECC71"
            />
            {/* Fresh Tomato on Side */}
            <circle cx="74" cy="44" r="12" fill="#E74C3C" />
            <path d="M74 34L72 30L76 34L79 31L76 36Z" fill="#2ECC71" />
        </svg>
    );
}

export function BurgerCartoon({
    className = "size-20",
}: {
    className?: string;
}) {
    return (
        <svg
            viewBox="0 0 100 100"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <ellipse
                cx="50"
                cy="86"
                rx="36"
                ry="7"
                fill="#000"
                fillOpacity="0.25"
            />
            {/* Bottom Bun */}
            <path
                d="M22 66C22 72 32 76 50 76C68 76 78 72 78 66H22Z"
                fill="#E59866"
            />
            <ellipse cx="50" cy="66" rx="28" ry="5" fill="#EDBB99" />
            {/* Burger Patty */}
            <rect x="20" y="58" width="60" height="8" rx="4" fill="#5D4037" />
            {/* Cheese slice */}
            <path d="M24 59L76 59L70 65L50 63L30 66L24 59Z" fill="#F1C40F" />
            {/* Top Bun */}
            <path
                d="M20 54C20 34 32 26 50 26C68 26 80 34 80 54H20Z"
                fill="#F0B27A"
            />
            {/* Sesame Seeds */}
            <ellipse
                cx="38"
                cy="38"
                rx="1.5"
                ry="3"
                transform="rotate(-30 38 38)"
                fill="#FFFFFF"
                fillOpacity="0.8"
            />
            <ellipse
                cx="50"
                cy="34"
                rx="1.5"
                ry="3"
                transform="rotate(10 50 34)"
                fill="#FFFFFF"
                fillOpacity="0.8"
            />
            <ellipse
                cx="62"
                cy="40"
                rx="1.5"
                ry="3"
                transform="rotate(30 62 40)"
                fill="#FFFFFF"
                fillOpacity="0.8"
            />
            <ellipse
                cx="44"
                cy="44"
                rx="1.5"
                ry="3"
                transform="rotate(-15 44 44)"
                fill="#FFFFFF"
                fillOpacity="0.8"
            />
            <ellipse
                cx="56"
                cy="44"
                rx="1.5"
                ry="3"
                transform="rotate(20 56 44)"
                fill="#FFFFFF"
                fillOpacity="0.8"
            />
        </svg>
    );
}

export function EthiopianTibsCartoon({
    className = "size-20",
}: {
    className?: string;
}) {
    return (
        <svg
            viewBox="0 0 100 100"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <ellipse
                cx="50"
                cy="88"
                rx="36"
                ry="6"
                fill="#000"
                fillOpacity="0.25"
            />
            {/* Pan / Skillet */}
            <circle cx="48" cy="54" r="32" fill="#2C3E50" />
            <circle cx="48" cy="54" r="28" fill="#1C2833" />
            {/* Handle */}
            <path
                d="M72 38L88 22"
                stroke="#2C3E50"
                strokeWidth="6"
                strokeLinecap="round"
            />
            {/* Meat chunks (cubes) */}
            <rect x="34" y="44" width="9" height="9" rx="2" fill="#873600" />
            <rect x="48" y="40" width="10" height="10" rx="2" fill="#6E2C00" />
            <rect x="42" y="56" width="10" height="9" rx="2" fill="#A04000" />
            <rect x="56" y="52" width="9" height="9" rx="2" fill="#873600" />
            <rect x="30" y="58" width="8" height="8" rx="2" fill="#6E2C00" />
            {/* Sliced Red Onion slivers */}
            <path
                d="M36 38C42 34 46 38 52 36"
                stroke="#AF7AC5"
                strokeWidth="2.5"
                strokeLinecap="round"
            />
            <path
                d="M52 64C58 60 62 66 68 62"
                stroke="#AF7AC5"
                strokeWidth="2.5"
                strokeLinecap="round"
            />
            <path
                d="M28 50C32 46 36 52 40 48"
                stroke="#D7BDE2"
                strokeWidth="2"
                strokeLinecap="round"
            />
            {/* Sliced Green Peppers */}
            <circle
                cx="46"
                cy="48"
                r="3"
                stroke="#2ECC71"
                strokeWidth="2"
                fill="none"
            />
            <circle
                cx="58"
                cy="44"
                r="3"
                stroke="#2ECC71"
                strokeWidth="2"
                fill="none"
            />
            <circle
                cx="36"
                cy="62"
                r="3"
                stroke="#27AE60"
                strokeWidth="2"
                fill="none"
            />
            {/* Rosemary Sprig */}
            <path
                d="M48 54L64 58"
                stroke="#1E8449"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
}

export function SauceJarCartoon({
    className = "size-20",
}: {
    className?: string;
}) {
    return (
        <svg
            viewBox="0 0 100 100"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <ellipse
                cx="50"
                cy="88"
                rx="28"
                ry="6"
                fill="#000"
                fillOpacity="0.25"
            />
            {/* Glass Jar Body */}
            <rect
                x="30"
                y="38"
                width="40"
                height="46"
                rx="8"
                fill="#BDC3C7"
                fillOpacity="0.3"
            />
            <rect x="32" y="42" width="36" height="40" rx="6" fill="#C0392B" />
            {/* White Label */}
            <rect x="34" y="50" width="32" height="18" rx="3" fill="#FFFFFF" />
            <rect x="38" y="56" width="24" height="2.5" rx="1" fill="#C0392B" />
            <rect x="42" y="61" width="16" height="2" rx="1" fill="#7F8C8D" />
            {/* Lid */}
            <rect x="28" y="28" width="44" height="12" rx="3" fill="#4A235A" />
            <rect x="30" y="30" width="40" height="3" rx="1" fill="#6C3483" />
        </svg>
    );
}

export function EggsCartoon({ className = "size-20" }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 100 100"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <ellipse
                cx="50"
                cy="88"
                rx="36"
                ry="6"
                fill="#000"
                fillOpacity="0.25"
            />
            {/* Back Egg Left */}
            <ellipse
                cx="36"
                cy="54"
                rx="13"
                ry="18"
                transform="rotate(-15 36 54)"
                fill="#E0BA8F"
            />
            <ellipse
                cx="35"
                cy="53"
                rx="12"
                ry="17"
                transform="rotate(-15 35 53)"
                fill="#F5CBA7"
            />
            {/* Back Egg Right */}
            <ellipse
                cx="66"
                cy="56"
                rx="13"
                ry="18"
                transform="rotate(15 66 56)"
                fill="#E0BA8F"
            />
            <ellipse
                cx="65"
                cy="55"
                rx="12"
                ry="17"
                transform="rotate(15 65 55)"
                fill="#F5CBA7"
            />
            {/* Center Egg */}
            <ellipse cx="50" cy="50" rx="14" ry="19" fill="#EDBB99" />
            <ellipse cx="49" cy="49" rx="13" ry="18" fill="#FDFEFE" />
            <ellipse
                cx="45"
                cy="42"
                rx="3"
                ry="6"
                transform="rotate(-20 45 42)"
                fill="#FFFFFF"
                fillOpacity="0.6"
            />
            {/* Cracked egg white & yolk in front */}
            <ellipse cx="50" cy="74" rx="20" ry="7" fill="#FFFFFF" />
            <circle cx="50" cy="73" r="5.5" fill="#F39C12" />
            <circle cx="49" cy="72" r="4.5" fill="#F1C40F" />
            <circle cx="48" cy="71" r="1.5" fill="#FFFFFF" />
        </svg>
    );
}

export function RedOnionCartoon({
    className = "size-24",
}: {
    className?: string;
}) {
    return (
        <svg
            viewBox="0 0 100 100"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <ellipse
                cx="50"
                cy="90"
                rx="30"
                ry="6"
                fill="#000"
                fillOpacity="0.25"
            />
            {/* Root tufts */}
            <path
                d="M44 82L42 90M50 84L50 92M56 82L58 90"
                stroke="#E59866"
                strokeWidth="2"
                strokeLinecap="round"
            />
            {/* Onion Bulb */}
            <ellipse cx="50" cy="54" rx="28" ry="32" fill="#7D1C4A" />
            <ellipse cx="50" cy="53" rx="26" ry="30" fill="#9B2D62" />
            <ellipse cx="48" cy="52" rx="24" ry="28" fill="#B33973" />
            {/* Vertical Segment Striations */}
            <path
                d="M50 24C40 38 40 68 50 82"
                stroke="#D2528F"
                strokeWidth="2.5"
                strokeLinecap="round"
            />
            <path
                d="M50 24C32 38 32 68 50 82"
                stroke="#7D1C4A"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <path
                d="M50 24C60 38 60 68 50 82"
                stroke="#D2528F"
                strokeWidth="2.5"
                strokeLinecap="round"
            />
            <path
                d="M50 24C68 38 68 68 50 82"
                stroke="#7D1C4A"
                strokeWidth="2"
                strokeLinecap="round"
            />
            {/* Center soft shine */}
            <ellipse
                cx="42"
                cy="46"
                rx="5"
                ry="12"
                transform="rotate(-15 42 46)"
                fill="#F48FB1"
                fillOpacity="0.45"
            />
            {/* Top stem / tip */}
            <path
                d="M50 24V16C50 14 52 12 54 10"
                stroke="#27AE60"
                strokeWidth="3"
                strokeLinecap="round"
            />
            <path
                d="M50 24V14"
                stroke="#82E0AA"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
}

export function GreenPepperCartoon({
    className = "size-24",
}: {
    className?: string;
}) {
    return (
        <svg
            viewBox="0 0 100 100"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <ellipse
                cx="50"
                cy="90"
                rx="30"
                ry="6"
                fill="#000"
                fillOpacity="0.25"
            />
            {/* Pepper Lobes */}
            <path
                d="M32 36C24 44 24 66 32 78C40 86 60 86 68 78C76 66 76 44 68 36C60 30 40 30 32 36Z"
                fill="#27AE60"
            />
            {/* Lobe highlights */}
            <path
                d="M36 38C30 46 30 68 36 76C40 82 48 82 48 76C48 68 44 46 36 38Z"
                fill="#2ECC71"
            />
            <path
                d="M64 38C70 46 70 68 64 76C60 82 52 82 52 76C52 68 56 46 64 38Z"
                fill="#2ECC71"
            />
            {/* Shine pill */}
            <ellipse
                cx="40"
                cy="52"
                rx="3"
                ry="10"
                fill="#A9DFBF"
                fillOpacity="0.8"
            />
            {/* Stem */}
            <path
                d="M50 32C50 22 56 16 64 14"
                stroke="#1E8449"
                strokeWidth="4.5"
                strokeLinecap="round"
            />
        </svg>
    );
}

export function CarrotCartoon({
    className = "size-24",
}: {
    className?: string;
}) {
    return (
        <svg
            viewBox="0 0 100 100"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <ellipse
                cx="50"
                cy="90"
                rx="26"
                ry="5"
                fill="#000"
                fillOpacity="0.25"
            />
            {/* Carrot Root (Angled) */}
            <path d="M42 32L62 44L28 88L42 32Z" fill="#E67E22" />
            <path d="M44 33L60 43L30 86L44 33Z" fill="#F39C12" />
            {/* Horizontal Grooves */}
            <path
                d="M42 45L48 48"
                stroke="#D35400"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            <path
                d="M38 56L46 60"
                stroke="#D35400"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            <path
                d="M34 68L40 71"
                stroke="#D35400"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            {/* Top Foliage Stalks */}
            <path
                d="M52 38L62 14"
                stroke="#27AE60"
                strokeWidth="3"
                strokeLinecap="round"
            />
            <path
                d="M52 38L48 10"
                stroke="#2ECC71"
                strokeWidth="3.5"
                strokeLinecap="round"
            />
            <path
                d="M52 38L38 18"
                stroke="#27AE60"
                strokeWidth="3"
                strokeLinecap="round"
            />
        </svg>
    );
}

export function AvocadoCartoon({
    className = "size-24",
}: {
    className?: string;
}) {
    return (
        <svg
            viewBox="0 0 100 100"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <ellipse
                cx="50"
                cy="88"
                rx="36"
                ry="6"
                fill="#000"
                fillOpacity="0.25"
            />
            {/* Whole Avocado (Left) */}
            <ellipse cx="36" cy="54" rx="16" ry="24" fill="#194D33" />
            <ellipse cx="34" cy="53" rx="14" ry="22" fill="#225E3E" />
            <ellipse
                cx="30"
                cy="46"
                rx="2"
                ry="7"
                fill="#68B07D"
                fillOpacity="0.6"
            />
            {/* Halved Avocado (Right) */}
            <ellipse cx="64" cy="54" rx="18" ry="24" fill="#1E5C38" />
            <ellipse cx="64" cy="54" rx="15" ry="21" fill="#C2D66C" />
            <ellipse cx="64" cy="54" rx="12" ry="18" fill="#E2EDA3" />
            {/* Brown Seed */}
            <circle cx="64" cy="60" r="8" fill="#6E3B1C" />
            <circle cx="63" cy="59" r="7" fill="#874C27" />
            <circle cx="61" cy="57" r="1.5" fill="#FFF" fillOpacity="0.4" />
        </svg>
    );
}

export function GarlicCartoon({
    className = "size-24",
}: {
    className?: string;
}) {
    return (
        <svg
            viewBox="0 0 100 100"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <ellipse
                cx="50"
                cy="90"
                rx="30"
                ry="6"
                fill="#000"
                fillOpacity="0.25"
            />
            {/* Garlic Bulb Lobes */}
            <path
                d="M50 20C40 32 26 48 26 66C26 80 38 86 50 86C62 86 74 80 74 66C74 48 60 32 50 20Z"
                fill="#EAECEE"
            />
            {/* Lobe curves */}
            <path
                d="M50 22C42 36 36 56 38 78"
                stroke="#BDC3C7"
                strokeWidth="2.5"
                strokeLinecap="round"
            />
            <path
                d="M50 22C58 36 64 56 62 78"
                stroke="#BDC3C7"
                strokeWidth="2.5"
                strokeLinecap="round"
            />
            {/* Center Clump */}
            <path
                d="M46 36C44 50 44 68 50 84C56 68 56 50 54 36"
                fill="#FFFFFF"
            />
            {/* Stem Top */}
            <rect x="48" y="10" width="4" height="12" rx="2" fill="#D5D8DC" />
        </svg>
    );
}

export function LemonCartoon({
    className = "size-24",
}: {
    className?: string;
}) {
    return (
        <svg
            viewBox="0 0 100 100"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <ellipse
                cx="50"
                cy="88"
                rx="34"
                ry="6"
                fill="#000"
                fillOpacity="0.25"
            />
            {/* Whole lemon */}
            <ellipse
                cx="46"
                cy="50"
                rx="24"
                ry="18"
                transform="rotate(-15 46 50)"
                fill="#F4D03F"
            />
            <ellipse
                cx="44"
                cy="49"
                rx="22"
                ry="16"
                transform="rotate(-15 44 49)"
                fill="#F9E79F"
            />
            <ellipse
                cx="38"
                cy="42"
                rx="4"
                ry="2"
                fill="#FFF"
                fillOpacity="0.5"
            />
            {/* Leaf */}
            <path
                d="M56 32C64 26 72 28 76 34C70 38 62 36 56 32Z"
                fill="#2ECC71"
            />
            {/* Sliced Half in Front */}
            <circle cx="66" cy="66" r="16" fill="#F1C40F" />
            <circle cx="66" cy="66" r="14" fill="#FFFFFF" />
            <circle cx="66" cy="66" r="12" fill="#F9E79F" />
            {/* Segments */}
            <circle cx="66" cy="66" r="3" fill="#FFFFFF" />
            <line
                x1="66"
                y1="54"
                x2="66"
                y2="78"
                stroke="#FFF"
                strokeWidth="1.5"
            />
            <line
                x1="54"
                y1="66"
                x2="78"
                y2="66"
                stroke="#FFF"
                strokeWidth="1.5"
            />
            <line
                x1="58"
                y1="58"
                x2="74"
                y2="74"
                stroke="#FFF"
                strokeWidth="1.5"
            />
            <line
                x1="74"
                y1="58"
                x2="58"
                y2="74"
                stroke="#FFF"
                strokeWidth="1.5"
            />
        </svg>
    );
}

export function ChickenBreastCartoon({
    className = "size-24",
}: {
    className?: string;
}) {
    return (
        <svg
            viewBox="0 0 100 100"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <ellipse
                cx="50"
                cy="88"
                rx="36"
                ry="6"
                fill="#000"
                fillOpacity="0.25"
            />
            {/* Breast 1 (Back) */}
            <ellipse
                cx="42"
                cy="48"
                rx="22"
                ry="15"
                transform="rotate(-15 42 48)"
                fill="#E8B49B"
            />
            <ellipse
                cx="40"
                cy="47"
                rx="20"
                ry="13"
                transform="rotate(-15 40 47)"
                fill="#F5CBA7"
            />
            {/* Breast 2 (Front) */}
            <ellipse
                cx="60"
                cy="60"
                rx="24"
                ry="16"
                transform="rotate(10 60 60)"
                fill="#E8B49B"
            />
            <ellipse
                cx="58"
                cy="59"
                rx="22"
                ry="14"
                transform="rotate(10 58 59)"
                fill="#FADBD8"
            />
            <ellipse
                cx="52"
                cy="54"
                rx="6"
                ry="2"
                transform="rotate(10 52 54)"
                fill="#FFFFFF"
                fillOpacity="0.4"
            />
        </svg>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// CUT STYLE CARTOONS (Used in Customizer side sheet Step 3)
// ─────────────────────────────────────────────────────────────────────────────

export function SteaksCutCartoon({
    className = "size-20",
}: {
    className?: string;
}) {
    return (
        <svg
            viewBox="0 0 100 70"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Left steak */}
            <ellipse cx="32" cy="38" rx="22" ry="16" fill="#FADBD8" />
            <ellipse cx="32" cy="38" rx="19" ry="13" fill="#C0392B" />
            <ellipse cx="32" cy="38" rx="16" ry="10" fill="#D94534" />
            <path
                d="M24 36C28 34 34 38 40 36"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeOpacity="0.8"
            />
            {/* Right steak */}
            <ellipse cx="68" cy="38" rx="22" ry="16" fill="#FADBD8" />
            <ellipse cx="68" cy="38" rx="19" ry="13" fill="#C0392B" />
            <ellipse cx="68" cy="38" rx="16" ry="10" fill="#D94534" />
            <path
                d="M60 36C64 34 70 38 76 36"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeOpacity="0.8"
            />
        </svg>
    );
}

export function CubesCutCartoon({
    className = "size-20",
}: {
    className?: string;
}) {
    return (
        <svg
            viewBox="0 0 100 70"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Isometric Red Meat Cubes */}
            {/* Cube 1 (Back left) */}
            <g transform="translate(20, 20)">
                <path d="M10 0L20 5L10 10L0 5Z" fill="#E74C3C" />
                <path d="M0 5L10 10V20L0 15Z" fill="#C0392B" />
                <path d="M10 10L20 5V15L10 20Z" fill="#922B21" />
            </g>
            {/* Cube 2 (Center back) */}
            <g transform="translate(42, 10)">
                <path d="M10 0L20 5L10 10L0 5Z" fill="#E74C3C" />
                <path d="M0 5L10 10V20L0 15Z" fill="#C0392B" />
                <path d="M10 10L20 5V15L10 20Z" fill="#922B21" />
            </g>
            {/* Cube 3 (Center mid) */}
            <g transform="translate(38, 26)">
                <path d="M10 0L20 5L10 10L0 5Z" fill="#E74C3C" />
                <path d="M0 5L10 10V20L0 15Z" fill="#C0392B" />
                <path d="M10 10L20 5V15L10 20Z" fill="#922B21" />
            </g>
            {/* Cube 4 (Front left) */}
            <g transform="translate(28, 38)">
                <path d="M10 0L20 5L10 10L0 5Z" fill="#E74C3C" />
                <path d="M0 5L10 10V20L0 15Z" fill="#C0392B" />
                <path d="M10 10L20 5V15L10 20Z" fill="#922B21" />
            </g>
            {/* Cube 5 (Right mid) */}
            <g transform="translate(58, 22)">
                <path d="M10 0L20 5L10 10L0 5Z" fill="#E74C3C" />
                <path d="M0 5L10 10V20L0 15Z" fill="#C0392B" />
                <path d="M10 10L20 5V15L10 20Z" fill="#922B21" />
            </g>
            {/* Cube 6 (Front right) */}
            <g transform="translate(52, 38)">
                <path d="M10 0L20 5L10 10L0 5Z" fill="#E74C3C" />
                <path d="M0 5L10 10V20L0 15Z" fill="#C0392B" />
                <path d="M10 10L20 5V15L10 20Z" fill="#922B21" />
            </g>
        </svg>
    );
}

export function StripsCutCartoon({
    className = "size-20",
}: {
    className?: string;
}) {
    return (
        <svg
            viewBox="0 0 100 70"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Strips / Batons scattered */}
            <rect
                x="18"
                y="24"
                width="28"
                height="6"
                rx="2"
                transform="rotate(-15 18 24)"
                fill="#C0392B"
            />
            <rect
                x="42"
                y="16"
                width="30"
                height="6"
                rx="2"
                transform="rotate(10 42 16)"
                fill="#D94534"
            />
            <rect
                x="26"
                y="38"
                width="32"
                height="6"
                rx="2"
                transform="rotate(5 26 38)"
                fill="#E74C3C"
            />
            <rect
                x="56"
                y="32"
                width="28"
                height="6"
                rx="2"
                transform="rotate(-25 56 32)"
                fill="#C0392B"
            />
            <rect
                x="34"
                y="50"
                width="30"
                height="6"
                rx="2"
                transform="rotate(-8 34 50)"
                fill="#D94534"
            />
            <rect
                x="52"
                y="46"
                width="30"
                height="6"
                rx="2"
                transform="rotate(18 52 46)"
                fill="#E74C3C"
            />
        </svg>
    );
}

export function MincedCutCartoon({
    className = "size-20",
}: {
    className?: string;
}) {
    return (
        <svg
            viewBox="0 0 100 70"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Minced meat mound */}
            <path
                d="M18 56C18 42 32 34 50 34C68 34 82 42 82 56C82 60 76 62 50 62C24 62 18 60 18 56Z"
                fill="#C0392B"
            />
            {/* Squiggle texture */}
            <path
                d="M26 52C28 48 32 54 36 50C40 46 44 52 48 48C52 44 56 50 60 46C64 42 68 48 72 44"
                stroke="#FFFFFF"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeOpacity="0.8"
            />
            <path
                d="M24 56C28 54 32 58 36 54C40 50 44 56 48 52C52 48 56 54 60 50C64 46 68 52 74 50"
                stroke="#FADBD8"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
            <path
                d="M32 44C36 42 40 46 44 42C48 38 52 44 56 40C60 36 64 42 68 38"
                stroke="#E74C3C"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
}

export function SlicesCutCartoon({
    className = "size-20",
}: {
    className?: string;
}) {
    return (
        <svg
            viewBox="0 0 100 70"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Slices stacked angled */}
            <ellipse
                cx="35"
                cy="42"
                rx="20"
                ry="14"
                fill="#C0392B"
                fillOpacity="0.4"
            />
            <ellipse cx="45" cy="38" rx="20" ry="14" fill="#E74C3C" />
            <ellipse cx="45" cy="38" rx="16" ry="10" fill="#FF7675" />
            <ellipse cx="58" cy="32" rx="20" ry="14" fill="#2ECC71" />
            <ellipse cx="58" cy="32" rx="16" ry="10" fill="#A8E6CF" />
            <circle cx="58" cy="32" r="3" fill="#27AE60" />
        </svg>
    );
}

export function JulienneCutCartoon({
    className = "size-20",
}: {
    className?: string;
}) {
    return (
        <svg
            viewBox="0 0 100 70"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Fine matchsticks */}
            <rect
                x="22"
                y="22"
                width="30"
                height="3"
                rx="1.5"
                transform="rotate(-20 22 22)"
                fill="#F39C12"
            />
            <rect
                x="36"
                y="16"
                width="32"
                height="3"
                rx="1.5"
                transform="rotate(15 36 16)"
                fill="#E67E22"
            />
            <rect
                x="28"
                y="34"
                width="34"
                height="3"
                rx="1.5"
                transform="rotate(5 28 34)"
                fill="#27AE60"
            />
            <rect
                x="52"
                y="28"
                width="30"
                height="3"
                rx="1.5"
                transform="rotate(-15 52 28)"
                fill="#2ECC71"
            />
            <rect
                x="30"
                y="48"
                width="32"
                height="3"
                rx="1.5"
                transform="rotate(-6 30 48)"
                fill="#E74C3C"
            />
            <rect
                x="48"
                y="42"
                width="30"
                height="3"
                rx="1.5"
                transform="rotate(22 48 42)"
                fill="#F1C40F"
            />
        </svg>
    );
}

export function WholeCutCartoon({
    className = "size-20",
}: {
    className?: string;
}) {
    return (
        <svg
            viewBox="0 0 100 70"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <ellipse
                cx="50"
                cy="58"
                rx="24"
                ry="6"
                fill="#000"
                fillOpacity="0.2"
            />
            <circle cx="50" cy="36" r="22" fill="#E8D5B5" />
            <circle cx="48" cy="34" r="20" fill="#F5E6CC" />
            <path
                d="M50 14C49 20 48 24 50 26"
                stroke="#8C632C"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <ellipse
                cx="42"
                cy="28"
                rx="4"
                ry="6"
                transform="rotate(-25 42 28)"
                fill="#FFF"
                fillOpacity="0.4"
            />
        </svg>
    );
}

export function GingerCartoon({
    className = "size-20",
}: {
    className?: string;
}) {
    return (
        <svg
            viewBox="0 0 100 100"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <ellipse
                cx="50"
                cy="86"
                rx="32"
                ry="6"
                fill="#000"
                fillOpacity="0.25"
            />
            {/* Ginger root body with knobby shapes */}
            <path
                d="M32 68C26 62 26 48 34 42C32 34 38 24 48 26C56 22 66 28 66 38C74 38 80 46 76 56C82 66 74 76 64 74C56 78 44 76 38 72L32 68Z"
                fill="#C69255"
            />
            <path
                d="M34 66C28 60 28 50 36 44C34 36 40 28 48 30C56 26 64 32 64 40C72 40 76 48 74 56C78 64 72 72 62 70C54 74 44 74 38 70L34 66Z"
                fill="#DEB078"
            />
            {/* Texture rings */}
            <path
                d="M38 46C42 48 46 48 50 46"
                stroke="#A77439"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <path
                d="M48 34C52 36 56 36 60 34"
                stroke="#A77439"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <path
                d="M56 50C62 52 68 50 72 48"
                stroke="#A77439"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <path
                d="M42 62C48 64 54 62 60 60"
                stroke="#A77439"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
}

export function CabbageCartoon({
    className = "size-20",
}: {
    className?: string;
}) {
    return (
        <svg
            viewBox="0 0 100 100"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <ellipse
                cx="50"
                cy="88"
                rx="34"
                ry="7"
                fill="#000"
                fillOpacity="0.25"
            />
            {/* Cabbage Head */}
            <circle cx="50" cy="52" r="32" fill="#229954" />
            <circle cx="48" cy="51" r="29" fill="#2ECC71" />
            {/* Outer Leaves curling over */}
            <path
                d="M22 52C22 34 36 24 50 24C42 32 40 48 44 64C32 64 22 60 22 52Z"
                fill="#27AE60"
            />
            <path
                d="M78 52C78 34 64 24 50 24C58 32 60 48 56 64C68 64 78 60 78 52Z"
                fill="#1E8449"
            />
            {/* Leaf Veins */}
            <path
                d="M50 26C50 42 50 62 50 80"
                stroke="#A9DFBF"
                strokeWidth="3"
                strokeLinecap="round"
            />
            <path
                d="M50 40C42 38 36 40 32 44"
                stroke="#A9DFBF"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <path
                d="M50 50C58 48 64 50 68 54"
                stroke="#A9DFBF"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <path
                d="M50 60C40 60 34 64 30 68"
                stroke="#A9DFBF"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
}

export function CucumberCartoon({
    className = "size-20",
}: {
    className?: string;
}) {
    return (
        <svg
            viewBox="0 0 100 100"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <ellipse
                cx="50"
                cy="88"
                rx="34"
                ry="6"
                fill="#000"
                fillOpacity="0.25"
            />
            {/* Cucumber Body curved */}
            <path
                d="M20 62C22 42 36 30 60 28C74 26 84 32 82 42C80 56 64 68 40 70C26 72 18 70 20 62Z"
                fill="#196F3D"
            />
            <path
                d="M22 60C24 44 38 34 58 32C72 30 80 34 78 42C76 54 62 64 40 66C28 68 20 66 22 60Z"
                fill="#27AE60"
            />
            {/* Cucumber Slices next to it */}
            <circle cx="34" cy="46" r="1.5" fill="#145A32" />
            <circle cx="48" cy="42" r="1.5" fill="#145A32" />
            <circle cx="62" cy="40" r="1.5" fill="#145A32" />
            {/* Front Slice */}
            <circle cx="70" cy="62" r="16" fill="#196F3D" />
            <circle cx="70" cy="62" r="13" fill="#D5F5E3" />
            <circle cx="70" cy="62" r="8" fill="#E8F8F5" />
            <circle cx="68" cy="60" r="1.5" fill="#52BE80" />
            <circle cx="72" cy="61" r="1.5" fill="#52BE80" />
            <circle cx="70" cy="65" r="1.5" fill="#52BE80" />
        </svg>
    );
}

export function ChiliPepperCartoon({
    className = "size-20",
}: {
    className?: string;
}) {
    return (
        <svg
            viewBox="0 0 100 100"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <ellipse
                cx="50"
                cy="88"
                rx="30"
                ry="6"
                fill="#000"
                fillOpacity="0.25"
            />
            {/* Chili Pod Curved */}
            <path
                d="M32 26C44 24 64 36 68 50C72 64 62 78 48 84C42 86 38 82 42 78C50 68 58 54 52 42C48 34 38 30 32 26Z"
                fill="#C0392B"
            />
            <path
                d="M34 28C44 26 62 38 66 50C70 62 60 74 48 80C44 80 42 76 46 72C52 64 58 52 52 42C48 36 38 32 34 28Z"
                fill="#E74C3C"
            />
            {/* Highlight */}
            <path
                d="M46 36C52 42 56 50 56 60"
                stroke="#F1948A"
                strokeWidth="2.5"
                strokeLinecap="round"
            />
            {/* Green Stem */}
            <path
                d="M30 24C24 22 22 14 26 10C28 14 30 18 34 20"
                stroke="#27AE60"
                strokeWidth="4"
                strokeLinecap="round"
            />
            <path
                d="M30 24C34 26 38 28 42 26"
                stroke="#2ECC71"
                strokeWidth="3"
                strokeLinecap="round"
            />
        </svg>
    );
}

export function CheeseCartoon({
    className = "size-20",
}: {
    className?: string;
}) {
    return (
        <svg
            viewBox="0 0 100 100"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <ellipse
                cx="50"
                cy="86"
                rx="36"
                ry="6"
                fill="#000"
                fillOpacity="0.25"
            />
            {/* Cheese Wedge */}
            <path d="M18 64L48 30L82 44L56 78L18 64Z" fill="#F39C12" />
            <path d="M18 64L56 78V68L18 54V64Z" fill="#D68910" />
            <path d="M56 78L82 44V34L56 68V78Z" fill="#E67E22" />
            <path d="M18 54L48 20L82 34L56 68L18 54Z" fill="#F1C40F" />
            <path d="M22 54L50 24L78 36L54 66L22 54Z" fill="#F7DC6F" />
            {/* Cheese holes */}
            <ellipse cx="44" cy="42" rx="4" ry="2.5" fill="#D4AC0D" />
            <ellipse cx="62" cy="50" rx="3" ry="2" fill="#D4AC0D" />
            <ellipse cx="34" cy="50" rx="2.5" ry="1.5" fill="#D4AC0D" />
        </svg>
    );
}

export function ButterPotCartoon({
    className = "size-20",
}: {
    className?: string;
}) {
    return (
        <svg
            viewBox="0 0 100 100"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <ellipse
                cx="50"
                cy="88"
                rx="32"
                ry="6"
                fill="#000"
                fillOpacity="0.25"
            />
            {/* Clay/Ceramic Pot */}
            <path
                d="M24 46C24 72 32 82 50 82C68 82 76 72 76 46H24Z"
                fill="#784212"
            />
            <path
                d="M26 46C26 70 34 78 50 78C66 78 74 70 74 46H26Z"
                fill="#873600"
            />
            {/* Gold Ghee / Niter Kibbeh surface */}
            <ellipse cx="50" cy="46" rx="26" ry="10" fill="#F1C40F" />
            <ellipse cx="50" cy="45" rx="24" ry="8" fill="#F7DC6F" />
            <ellipse cx="46" cy="44" rx="16" ry="5" fill="#FEF9E7" />
        </svg>
    );
}

export function CookingOilCartoon({
    className = "size-20",
}: {
    className?: string;
}) {
    return (
        <svg
            viewBox="0 0 100 100"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <ellipse
                cx="50"
                cy="88"
                rx="26"
                ry="6"
                fill="#000"
                fillOpacity="0.25"
            />
            {/* Bottle Body */}
            <rect
                x="34"
                y="38"
                width="32"
                height="46"
                rx="6"
                fill="#FAD7A0"
                fillOpacity="0.4"
            />
            <rect x="36" y="42" width="28" height="40" rx="4" fill="#F39C12" />
            {/* Bottle Neck & Cap */}
            <path d="M44 38V22H56V38" fill="#FAD7A0" fillOpacity="0.5" />
            <rect x="42" y="16" width="16" height="8" rx="2" fill="#E74C3C" />
            {/* Golden Oil Waves inside */}
            <path d="M36 50C42 48 50 52 64 50V82H36V50Z" fill="#F1C40F" />
            <ellipse
                cx="42"
                cy="58"
                rx="2"
                ry="8"
                fill="#FFF"
                fillOpacity="0.5"
            />
        </svg>
    );
}
