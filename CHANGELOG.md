# Changelog

## [0.2.0](https://github.com/faberjs/faber-cli/compare/v0.1.0...v0.2.0) (2025-04-16)


### Features

* **actions:** change `replace` action to replace all occurrences when passing string ([3fecf29](https://github.com/faberjs/faber-cli/commit/3fecf296c0aafbb1a26934e4f4a8c89d73fa8465))
* **commands:** delete faberconfig file in the `faber create` command, and add `--keep-config` option ([d3d8b1d](https://github.com/faberjs/faber-cli/commit/d3d8b1d17b15baa1669f66850edd38330c2986af))


### Bug Fixes

* **cli:** add error handler to `faber create` without a provided or configured boilerplate ([8994085](https://github.com/faberjs/faber-cli/commit/8994085a26a84d09d99c1b23c2c3444735daba45))

## [0.1.0](https://github.com/faberjs/faber-cli/compare/v0.0.3...v0.1.0) (2025-04-08)


### Features

* **actions:** add support for more commenting styles on the `conditional` action ([8a480e5](https://github.com/faberjs/faber-cli/commit/8a480e5a840cc64ec75832969c1ea9a9cebbb516))
* **actions:** huge refactor for src folder and functionality review ([8dc7645](https://github.com/faberjs/faber-cli/commit/8dc7645265efbd3ae33f0166735307abeec24324))
* **actions:** review the `conditional` and `run` actions ([fd258e2](https://github.com/faberjs/faber-cli/commit/fd258e2973e80440756556dcc37eada2228019c4))
* **config:** add support for `.cjs` and `.mjs` extensions for the faberconfig file ([18d500c](https://github.com/faberjs/faber-cli/commit/18d500ce8bd50ee3c57528ef86d79a151bb67d1f))
* **logging:** add working directory on result description for the `run` action ([b9cb2ab](https://github.com/faberjs/faber-cli/commit/b9cb2ab1f352d7befc6f44569ec405c17f42333b))
