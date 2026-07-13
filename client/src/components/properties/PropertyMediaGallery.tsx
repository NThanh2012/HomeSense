import { PropertyMedia } from '../../features/properties/properties.types';

interface PropertyMediaGalleryProps {
    media: PropertyMedia[];
    title: string;
}

export function PropertyMediaGallery({ media, title }: PropertyMediaGalleryProps) {
    const images = media.filter((item) => item.type === 'IMAGE');

    if (images.length < 1) {
        return <div className="detail-media-empty">Bất động sản này chưa có hình ảnh.</div>;
    }

    return (
        <div className="media-gallery">
            <img className="media-gallery-primary" src={images[0].url} alt={title} />

            {images.length > 1 ? (
                <div className="media-gallery-thumbs">
                    {images.slice(1, 5).map((item, index) => (
                        <img key={item.id} src={item.url} alt={`${title} ${index + 2}`} />
                    ))}
                </div>
            ) : null}
        </div>
    );
}
