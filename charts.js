(function () {
  function sparkline(values) {
    const w=520,h=82,p=7;
    if (!values.length) values=[0,0];
    const min=Math.min(...values),max=Math.max(...values),span=max-min||1;
    const points=values.map((v,i)=>`${p+i*(w-2*p)/Math.max(1,values.length-1)},${h-p-(v-min)/span*(h-2*p)}`).join(" ");
    return `<svg class="sparkline" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-label="Trend chart"><defs><linearGradient id="sparkFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#829db8" stop-opacity=".25"/><stop offset="1" stop-color="#829db8" stop-opacity="0"/></linearGradient></defs><polygon points="${p},${h-p} ${points} ${w-p},${h-p}" fill="url(#sparkFill)"/><polyline points="${points}" fill="none" stroke="#718da9" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  function bars(rows, format) {
    const max=Math.max(1,...rows.map(x=>x.value));
    return rows.map(r=>`<div class="bar-row"><span>${escapeHtml(r.label)}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.max(0,Math.min(100,r.value/max*100))}%"></div></div><span class="bar-value">${format(r.value)}</span></div>`).join("");
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  window.FinoraCharts={sparkline,bars};
})();