
export function debounce<T extends (...a: any)=>any>(fn: T, delay?: number): T {
    if (delay === undefined) delay = 100;

    var timer;

    return function () {
        const args = arguments;
        const thiss = this;
        if (timer) clearTimeout(timer);

        timer = setTimeout(function () {
            fn.apply(this, args);
        }, delay);
    } as T;
}

export function getCssVarColor(varname) {
    var cssTerm = getComputedStyle(document.body)
        .getPropertyValue(varname);

    var calcSpan = document.createElement("span");
    calcSpan.style.color = cssTerm;

    return calcSpan.style.color;
}
