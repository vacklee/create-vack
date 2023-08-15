import { h, defineAsyncComponent, defineComponent, Suspense } from 'vue';

export default function createPageComponent(component, {
  name,
  meta,
}) {
  const SourceComp = defineAsyncComponent(component);

  return defineComponent({
    name: `Page${name}Wrap`,
    setup(props, context) {
      return () => {
        const node = h(SourceComp, {
          ...props,
          ...context.attrs,
        });

        if (meta.suspense) {
          return h(Suspense, [node]);
        }

        return node;
      };
    },
  });
}
