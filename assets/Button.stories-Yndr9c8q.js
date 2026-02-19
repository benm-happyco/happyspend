import{B as r,j as e}from"./iframe-CkNspWXC.js";import{S as i,T as d,G as c}from"./Stack-BqUOvxx9.js";import"./preload-helper-BxEPdfLd.js";const k={title:"Theme/Button",component:r,parameters:{layout:"centered"},tags:["autodocs"],argTypes:{size:{control:"radio",options:["sm","lg"]}},args:{children:"Button",size:"lg",variant:"filled",color:"purple"}},t={},n={render:s=>e.jsxs(i,{gap:"sm",children:[e.jsx(d,{size:"sm",c:"dimmed",children:"Variants"}),e.jsxs(c,{children:[e.jsx(r,{...s,variant:"filled",children:"Filled"}),e.jsx(r,{...s,variant:"light",children:"Light"}),e.jsx(r,{...s,variant:"subtle",children:"Subtle"})]})]})},a={render:s=>e.jsxs(i,{gap:"sm",children:[e.jsx(d,{size:"sm",c:"dimmed",children:"Sizes"}),e.jsxs(c,{children:[e.jsx(r,{...s,size:"sm",children:"Small"}),e.jsx(r,{...s,size:"lg",children:"Large"})]})]})},o={render:s=>e.jsxs(i,{gap:"sm",children:[e.jsx(d,{size:"sm",c:"dimmed",children:"States"}),e.jsxs(c,{children:[e.jsx(r,{...s,children:"Default"}),e.jsx(r,{...s,disabled:!0,children:"Disabled"}),e.jsx(r,{...s,loading:!0,children:"Loading"})]})]})};var l,m,u;t.parameters={...t.parameters,docs:{...(l=t.parameters)==null?void 0:l.docs,source:{originalSource:"{}",...(u=(m=t.parameters)==null?void 0:m.docs)==null?void 0:u.source}}};var p,g,x;n.parameters={...n.parameters,docs:{...(p=n.parameters)==null?void 0:p.docs,source:{originalSource:`{
  render: args => <Stack gap="sm">
      <Text size="sm" c="dimmed">
        Variants
      </Text>
      <Group>
        <Button {...args} variant="filled">
          Filled
        </Button>
        <Button {...args} variant="light">
          Light
        </Button>
        <Button {...args} variant="subtle">
          Subtle
        </Button>
      </Group>
    </Stack>
}`,...(x=(g=n.parameters)==null?void 0:g.docs)==null?void 0:x.source}}};var S,h,B;a.parameters={...a.parameters,docs:{...(S=a.parameters)==null?void 0:S.docs,source:{originalSource:`{
  render: args => <Stack gap="sm">
      <Text size="sm" c="dimmed">
        Sizes
      </Text>
      <Group>
        <Button {...args} size="sm">
          Small
        </Button>
        <Button {...args} size="lg">
          Large
        </Button>
      </Group>
    </Stack>
}`,...(B=(h=a.parameters)==null?void 0:h.docs)==null?void 0:B.source}}};var j,z,T;o.parameters={...o.parameters,docs:{...(j=o.parameters)==null?void 0:j.docs,source:{originalSource:`{
  render: args => <Stack gap="sm">
      <Text size="sm" c="dimmed">
        States
      </Text>
      <Group>
        <Button {...args}>Default</Button>
        <Button {...args} disabled>
          Disabled
        </Button>
        <Button {...args} loading>
          Loading
        </Button>
      </Group>
    </Stack>
}`,...(T=(z=o.parameters)==null?void 0:z.docs)==null?void 0:T.source}}};const v=["Playground","Variants","Sizes","States"];export{t as Playground,a as Sizes,o as States,n as Variants,v as __namedExportsOrder,k as default};
