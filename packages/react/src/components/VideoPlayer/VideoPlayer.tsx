import { forwardRef, useId } from 'react';
import { cx } from '../../utils/cx';
import './VideoPlayer.css';

export interface VideoSource {
  src: string;
  type?: string;
}

export interface VideoTrack {
  src: string;
  kind: 'captions' | 'chapters' | 'descriptions' | 'metadata' | 'subtitles';
  srcLang: string;
  label: string;
  default?: boolean;
}

export interface VideoPlayerProps
  extends Omit<React.VideoHTMLAttributes<HTMLVideoElement>, 'children'> {
  label?: string;
  description?: string;
  error?: string;
  aspectRatio?: '16/9' | '4/3' | '1/1';
  sources?: VideoSource[];
  tracks?: VideoTrack[];
}

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  (
    {
      id,
      label,
      description,
      error,
      aspectRatio = '16/9',
      sources,
      tracks,
      className,
      src,
      controls = true,
      preload = 'metadata',
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const videoId = id ?? generatedId;
    const descriptionId = description ? `${videoId}-description` : undefined;
    const errorId = error ? `${videoId}-error` : undefined;
    const describedBy =
      [ariaDescribedBy, descriptionId, errorId].filter(Boolean).join(' ') ||
      undefined;

    const hasSource = Boolean(src) || Boolean(sources?.length);

    return (
      <div className="pf-field">
        {label ? (
          <label className="pf-field__label" htmlFor={videoId}>
            {label}
          </label>
        ) : null}

        <div
          className={cx(
            'pf-video-player',
            `pf-video-player--ratio-${aspectRatio.replace('/', '-')}`,
            error && 'pf-video-player--invalid',
            className,
          )}
        >
          {hasSource ? (
            <video
              {...props}
              ref={ref}
              id={videoId}
              className="pf-video-player__video"
              controls={controls}
              preload={preload}
              src={src}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
            >
              {sources?.map((source) => (
                <source key={`${source.src}-${source.type ?? 'default'}`} src={source.src} type={source.type} />
              ))}
              {tracks?.map((track) => (
                <track
                  key={`${track.src}-${track.kind}-${track.srcLang}`}
                  src={track.src}
                  kind={track.kind}
                  srcLang={track.srcLang}
                  label={track.label}
                  default={track.default}
                />
              ))}
            </video>
          ) : (
            <div className="pf-video-player__empty" role="note" id={videoId}>
              Add a video src to display playback.
            </div>
          )}
        </div>

        {description ? (
          <p className="pf-field__description" id={descriptionId}>
            {description}
          </p>
        ) : null}
        {error ? (
          <p className="pf-field__error" id={errorId}>
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

VideoPlayer.displayName = 'VideoPlayer';
