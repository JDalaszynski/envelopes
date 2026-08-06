import 'react';

/**
 * Deklaracja web componentu InPost Geowidget.
 * Widget rejestruje własny element `<inpost-geowidget>`, którego React
 * nie zna z definicji — poniższe rozszerzenie pozwala używać go w JSX.
 */
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'inpost-geowidget': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          token?: string;
          language?: string;
          config?: string;
          onpoint?: string;
        },
        HTMLElement
      >;
    }
  }
}
