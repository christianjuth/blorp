import { Markdown } from "~/src/components/markdown";

const md = `

# Title

----------

## H2

### H3

#### H4

##### H5

###### H6

This is a test

_testing_

__this is a test__




`;

export default function Page() {
  return <Markdown markdown={md} />;
}
