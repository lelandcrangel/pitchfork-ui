import { composeDescribedBy } from '@pitchfork-ui/core';
import { Component, Element, h, Host, Method, Prop } from '@stencil/core';

/** One alternative encoding of the same video. */
export interface PfVideoSource {
  src: string;
  type?: string;
}

/** One caption, subtitle or chapter track. */
export interface PfVideoTrack {
  src: string;
  kind: 'captions' | 'chapters' | 'descriptions' | 'metadata' | 'subtitles';
  srclang: string;
  label: string;
  default?: boolean;
}

/**
 * A `<video>` in a framed, fixed-ratio box, with a label, a description and
 * an error message.
 *
 * `sources` and `tracks` are **properties**, not slotted children, and this
 * is one of the few places where that is forced rather than chosen: a
 * `<source>` has to be a child of the `<video>` itself, and slotted content
 * stays in the light DOM — a slotted `<source>` would be a child of this
 * element, which the video would never look at. They are rendered into the
 * shadow `<video>` instead.
 *
 * The label names the video with an IDREF rather than a `<label for>`:
 * `for` must point at a *labelable* element and a `<video>` is not one, so
 * the React `VideoPlayer`'s `htmlFor` was silently doing nothing and the
 * video had no accessible name at all. Both layers use `aria-labelledby`
 * now, and here it is a same-root reference, which is the kind that
 * resolves.
 *
 * @slot empty - what to show when there is no video to play.
 * @part field - the wrapper around label, frame and messages.
 * @part label - the label.
 * @part frame - the fixed-ratio box.
 * @part video - the video element.
 * @part empty - the empty state's box.
 * @part description - the hint text.
 * @part error - the error message.
 */
@Component({
  tag: 'pf-video-player',
  styleUrl: 'pf-video-player.css',
  shadow: true,
})
export class PfVideoPlayer {
  @Element() el!: HTMLElement;

  /** A single source. Use `sources` for several encodings. */
  @Prop() src?: string;

  /** Several encodings of the same video, best first. */
  @Prop() sources: PfVideoSource[] = [];

  /** Captions and subtitles. A video without them is not finished. */
  @Prop() tracks: PfVideoTrack[] = [];

  /** Drawn above the frame, and what names the video. */
  @Prop() label?: string;

  @Prop() description?: string;

  /** Error message. Its presence is what marks the frame invalid. */
  @Prop() error?: string;

  /** Reflected, because the stylesheet selects on it for the box's ratio. */
  @Prop({ reflect: true }) aspectRatio: '16/9' | '4/3' | '1/1' = '16/9';

  @Prop() controls = true;

  @Prop() poster?: string;

  @Prop() preload: 'none' | 'metadata' | 'auto' = 'metadata';

  @Prop({ reflect: true }) muted = false;

  @Prop({ reflect: true }) loop = false;

  @Prop({ reflect: true }) autoplay = false;

  private video?: HTMLVideoElement;

  /** Starts playback, which a consumer cannot do through the shadow root. */
  @Method()
  async play(): Promise<void> {
    await this.video?.play();
  }

  /** Pauses it. */
  @Method()
  async pause() {
    this.video?.pause();
  }

  /** The video element itself, for anything these methods do not cover. */
  @Method()
  async getVideoElement(): Promise<HTMLVideoElement | undefined> {
    return this.video;
  }

  private get sourceList(): PfVideoSource[] {
    return Array.isArray(this.sources) ? this.sources : [];
  }

  private get trackList(): PfVideoTrack[] {
    return Array.isArray(this.tracks) ? this.tracks : [];
  }

  render() {
    const hasVideo = Boolean(this.src) || this.sourceList.length > 0;
    const describedBy = composeDescribedBy(
      this.description && 'description',
      this.error && 'error',
    );

    return (
      <Host>
        <div class="field" part="field">
          {this.label && (
            <span class="label" part="label" id="label">
              {this.label}
            </span>
          )}

          <div class={{ frame: true, 'frame--invalid': Boolean(this.error) }} part="frame">
            {hasVideo ? (
              <video
                class="video"
                part="video"
                ref={(node) => (this.video = node)}
                controls={this.controls}
                poster={this.poster}
                preload={this.preload}
                muted={this.muted}
                loop={this.loop}
                autoplay={this.autoplay}
                src={this.src}
                aria-labelledby={this.label ? 'label' : null}
                aria-invalid={this.error ? 'true' : null}
                aria-describedby={describedBy}
              >
                {this.sourceList.map((source) => (
                  <source src={source.src} type={source.type} />
                ))}
                {this.trackList.map((track) => (
                  <track
                    src={track.src}
                    kind={track.kind}
                    srclang={track.srclang}
                    label={track.label}
                    default={track.default}
                  />
                ))}
              </video>
            ) : (
              <div class="empty" part="empty" role="note">
                <slot name="empty">Add a video src to display playback.</slot>
              </div>
            )}
          </div>

          {this.description && (
            <p class="description" part="description" id="description">
              {this.description}
            </p>
          )}

          {this.error && (
            <p class="error" part="error" id="error">
              {this.error}
            </p>
          )}
        </div>
      </Host>
    );
  }
}
