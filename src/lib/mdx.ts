import { visit } from 'unist-util-visit';

export const rehypeMermaid = () => (tree: any) => {
  visit(tree, 'element', (node: any) => {
    if (node.tagName === 'pre') {
      const codeNode = node.children.find((c: any) => c.tagName === 'code');
      if (
        codeNode &&
        codeNode.properties?.className &&
        Array.isArray(codeNode.properties.className) &&
        codeNode.properties.className.includes('language-mermaid')
      ) {
        // Transform pre > code.language-mermaid into div.mermaid-block
        node.tagName = 'div';
        node.properties = {
          className: ['mermaid-block'],
          'data-chart': codeNode.children[0]?.value || '',
        };
        node.children = [];
      }
    }
  });
};
