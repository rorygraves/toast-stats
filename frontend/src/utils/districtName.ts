/**
 * A descriptive district name is anything beyond the bare district number
 * (e.g. "District 57 Carolinas" but not "57"). The Toastmasters CSV exports
 * frequently set `districtName` to the bare ID, which the `D{id}` chip
 * already conveys — so we suppress the name in that case.
 */
export const hasDescriptiveName = (name: string | undefined): boolean =>
  !!name && !/^\d+$/.test(name.trim())
