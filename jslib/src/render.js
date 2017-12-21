import simple from "./renders/simple"
import messenger from "./renders/messenger"
export default {
  simple: {
    id : "simple",
    label: "test panel",
    tooltip: "panel for test",
    render: simple
  },
  messenger: {
    id : "messenger",
    label: "messenger panel",
    tooltip: "test panel for send messages",
    render: messenger
  },
}
