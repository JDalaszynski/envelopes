import { EnvelopePlaceholder } from '@/components/ui/EnvelopePlaceholder';
import { type BlogPost } from '@/lib/blog';
import { shotByFile, showcaseSrc, showcaseSrcSet } from '@/lib/showcase';

interface Props {
  post: BlogPost;
  /** Proporcje kadru — domyślnie 'wide' 16:9 dla kart i nagłówków artykułów */
  ratio?: 'photo' | 'wide' | 'portrait' | 'square';
  size?: 'sm' | 'md' | 'lg';
  sizes?: string;
  eager?: boolean;
  className?: string;
}

const RATIOS = { photo: '4 / 3', wide: '16 / 9', portrait: '3 / 4', square: '1 / 1' };

const DEFAULT_SIZES =
  '(max-width: 620px) calc(100vw - 48px), (max-width: 900px) calc(50vw - 36px), (max-width: 1248px) calc(33.3vw - 32px), 368px';

/**
 * Zdjęcie główne / okładkowe artykułu blogowego.
 *
 * Jeśli wpis ma przypisany kadr ze zdjęć aranżacyjnych (`public/images/zastosowania/`),
 * renderuje go z responsywnym `srcSet` i dopasowanym tekstem alternatywnym.
 * W przypadku braku dedykowanego kadru wyświetla `EnvelopePlaceholder` jako fallback.
 */
export function BlogCoverImage({
  post,
  ratio = 'wide',
  size = 'md',
  sizes = DEFAULT_SIZES,
  eager = false,
  className,
}: Props) {
  if (post.showcaseFile) {
    try {
      const shot = shotByFile(post.showcaseFile);
      return (
        <figure
          className={`placeholder ${className ?? ''}`.trim()}
          style={{
            aspectRatio: RATIOS[ratio],
            padding: 0,
            background: 'var(--color-surface)',
            overflow: 'hidden',
          }}
        >
          <img
            src={showcaseSrc(shot)}
            srcSet={showcaseSrcSet(shot)}
            sizes={sizes}
            alt={shot.alt}
            loading={eager ? 'eager' : 'lazy'}
            fetchPriority={eager ? 'high' : undefined}
            decoding="async"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </figure>
      );
    } catch {
      // Fallback if shot was not found
    }
  }

  return (
    <EnvelopePlaceholder
      format={post.format}
      colorId={post.colorId}
      ratio={ratio}
      size={size}
      hideCaption
      hasPrint={post.imageVariant === 'nadruk'}
      hasPersonalization={post.imageVariant === 'personalizacja'}
      sizes={sizes}
      eager={eager}
    />
  );
}
