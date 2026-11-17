/**
 * The one linked tile (product cards, store products, saved designs): a card that lifts 2px under
 * the pointer while its picture zooms 3% inside its frame. Pair `tile.root` with the `group` class.
 */
export const tile = {
  root: 'group overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-[border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-sm motion-reduce:hover:translate-y-0',
  media: 'transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:group-hover:scale-100',
}
