import { forwardRef, useEffect, useMemo, useState } from 'react';
import { cx } from '../../utils/cx';
import { Icon } from '../Icon';
import './Carousel.css';

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

export interface CarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  slides: React.ReactNode[];
  initialIndex?: number;
  loop?: boolean;
  showIndicators?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  onIndexChange?: (index: number) => void;
}

export const Carousel = forwardRef<HTMLDivElement, CarouselProps>(
  function Carousel(
    {
      className,
      slides,
      initialIndex = 0,
      loop = true,
      showIndicators = true,
      autoPlay = false,
      autoPlayInterval = 5000,
      onIndexChange,
      'aria-label': ariaLabel = 'Carousel',
      ...props
    },
    ref,
  ) {
  const totalSlides = slides.length;
  const boundedInitialIndex = clamp(
    initialIndex,
    0,
    Math.max(totalSlides - 1, 0),
  );
  const [activeIndex, setActiveIndex] = useState(boundedInitialIndex);
  const resolvedActiveIndex = clamp(
    activeIndex,
    0,
    Math.max(totalSlides - 1, 0),
  );

  const goToIndex = (nextIndex: number) => {
    if (totalSlides === 0) {
      return;
    }

    const resolvedIndex = loop
      ? ((nextIndex % totalSlides) + totalSlides) % totalSlides
      : clamp(nextIndex, 0, totalSlides - 1);

    setActiveIndex(resolvedIndex);
    onIndexChange?.(resolvedIndex);
  };

  useEffect(() => {
    if (!autoPlay || totalSlides < 2) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) => {
        const next = loop
          ? (current + 1) % totalSlides
          : Math.min(current + 1, totalSlides - 1);
        onIndexChange?.(next);
        return next;
      });
    }, autoPlayInterval);

    return () => {
      window.clearInterval(interval);
    };
  }, [autoPlay, autoPlayInterval, loop, onIndexChange, totalSlides]);

  const isPrevDisabled = !loop && resolvedActiveIndex <= 0;
  const isNextDisabled = !loop && resolvedActiveIndex >= totalSlides - 1;

  const slideLabel = useMemo(() => {
    if (totalSlides === 0) {
      return 'No slides';
    }

    return `Slide ${resolvedActiveIndex + 1} of ${totalSlides}`;
  }, [resolvedActiveIndex, totalSlides]);

  return (
    <div
      ref={ref}
      className={cx('pf-carousel', className)}
      aria-label={ariaLabel}
      {...props}
    >
      <div
        className="pf-carousel__viewport"
        role="region"
        aria-roledescription="carousel"
        aria-label={slideLabel}
      >
        {totalSlides === 0 ? (
          <div className="pf-carousel__empty" role="status">
            Add at least one slide.
          </div>
        ) : (
          <div
            className="pf-carousel__track"
            style={{ transform: `translateX(-${resolvedActiveIndex * 100}%)` }}
          >
            {slides.map((slide, index) => (
              <div
                key={`slide-${index}`}
                className="pf-carousel__slide"
                role="group"
                aria-roledescription="slide"
                aria-label={`Slide ${index + 1} of ${totalSlides}`}
                aria-hidden={index !== resolvedActiveIndex}
              >
                {slide}
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className="pf-carousel__controls"
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            goToIndex(resolvedActiveIndex - 1);
          } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            goToIndex(resolvedActiveIndex + 1);
          }
        }}
      >
        <button
          type="button"
          className="pf-carousel__nav"
          aria-label="Previous slide"
          disabled={isPrevDisabled || totalSlides < 2}
          onClick={() => {
            goToIndex(resolvedActiveIndex - 1);
          }}
        >
          <Icon name="square-caret-left" aria-hidden />
        </button>

        {showIndicators && totalSlides > 1 ? (
          <div
            className="pf-carousel__indicators"
            aria-label="Slide indicators"
          >
            {slides.map((_, index) => {
              const isActive = index === resolvedActiveIndex;

              return (
                <button
                  key={`indicator-${index}`}
                  type="button"
                  className={cx(
                    'pf-carousel__indicator',
                    isActive && 'pf-carousel__indicator--active',
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                  aria-current={isActive ? 'true' : undefined}
                  onClick={() => {
                    goToIndex(index);
                  }}
                />
              );
            })}
          </div>
        ) : (
          <span className="pf-carousel__indicator-spacer" aria-hidden />
        )}

        <button
          type="button"
          className="pf-carousel__nav"
          aria-label="Next slide"
          disabled={isNextDisabled || totalSlides < 2}
          onClick={() => {
            goToIndex(resolvedActiveIndex + 1);
          }}
        >
          <Icon name="square-caret-right" aria-hidden />
        </button>
      </div>
    </div>
  );
});

Carousel.displayName = 'Carousel';
