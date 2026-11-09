document.querySelectorAll('[data-publications]').forEach((section) => {
  const search = section.querySelector('[data-paper-search]');
  if (!search) return;
  const buttons = [...section.querySelectorAll('[data-filter]')];
  const papers = [...section.querySelectorAll('[data-paper]')];
  const empty = section.querySelector('[data-paper-empty]');
  const status = section.querySelector('[data-paper-status]');
  let selected = 'all';
  const update = () => {
    const terms = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let count = 0;
    papers.forEach((paper) => {
      const visible = (selected === 'all' || paper.dataset.kind === selected)
        && terms.every((term) => paper.dataset.search.includes(term));
      paper.hidden = !visible;
      if (visible) count += 1;
    });
    empty.hidden = count > 0;
    status.textContent = document.documentElement.lang.startsWith('zh')
      ? `显示 ${count} 篇论文。`
      : `${count} publication${count === 1 ? '' : 's'} shown.`;
  };
  buttons.forEach((button) => button.addEventListener('click', () => {
    selected = button.dataset.filter;
    buttons.forEach((item) => {
      item.classList.toggle('is-active', item === button);
      item.setAttribute('aria-pressed', String(item === button));
    });
    update();
  }));
  search.addEventListener('input', update);
  update();
});

document.querySelectorAll('[data-language]').forEach((link) => {
  const destination = new URL(link.href);
  destination.search = window.location.search;
  destination.hash = window.location.hash;
  link.href = destination.href;
});
