# Legacy screens (frozen)

LG1 (new tab layout) removed these screens from navigation. Expo Router turns
every file under `app/` into a route, so they were moved here unchanged to make
them unreachable while keeping the code (plan: "files are kept", "no legacy
store code is deleted"). Paths mirror their old place under `app/`.

They still import shared code (`@/store/budget`, `@/components/...`) and are
type-checked, but nothing imports them. Delete them only with the product
owner's approval.
