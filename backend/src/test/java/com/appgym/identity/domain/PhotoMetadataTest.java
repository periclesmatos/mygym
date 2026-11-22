package com.appgym.identity.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.zip.CRC32;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;

class PhotoMetadataTest {
    static final byte[] GPS = "Exif GPS -23.5505,-46.6333".getBytes(StandardCharsets.US_ASCII);

    @Test
    void removesJpegExifAndKeepsTheImage() throws Exception {
        byte[] plain = image("jpeg");
        ByteArrayOutputStream tagged = new ByteArrayOutputStream();
        tagged.write(plain, 0, 2);
        tagged.write(new byte[] {(byte) 0xFF, (byte) 0xE1, 0, (byte) (GPS.length + 2)});
        tagged.write(GPS);
        tagged.write(plain, 2, plain.length - 2);
        check("image/jpeg", tagged.toByteArray());
    }

    @Test
    void removesPngTextAndKeepsTheImage() throws Exception {
        byte[] plain = image("png");
        byte[] type = "tEXt".getBytes(StandardCharsets.US_ASCII);
        CRC32 crc = new CRC32();
        crc.update(type);
        crc.update(GPS);
        ByteArrayOutputStream tagged = new ByteArrayOutputStream();
        tagged.write(plain, 0, 33);
        tagged.write(ByteBuffer.allocate(4).putInt(GPS.length).array());
        tagged.write(type);
        tagged.write(GPS);
        tagged.write(ByteBuffer.allocate(4).putInt((int) crc.getValue()).array());
        tagged.write(plain, 33, plain.length - 33);
        check("image/png", tagged.toByteArray());
    }

    @Test
    void removesWebpExif() {
        ByteBuffer file = ByteBuffer.allocate(12 + 8 + 4 + 8 + GPS.length).order(java.nio.ByteOrder.LITTLE_ENDIAN);
        file.put("RIFF".getBytes(StandardCharsets.US_ASCII)).putInt(file.capacity() - 8);
        file.put("WEBPVP8L".getBytes(StandardCharsets.US_ASCII)).putInt(4).putInt(7);
        file.put("EXIF".getBytes(StandardCharsets.US_ASCII)).putInt(GPS.length).put(GPS);
        byte[] clean = PhotoMetadata.strip("image/webp", file.array()).orElseThrow();
        assertThat(new String(clean, StandardCharsets.ISO_8859_1))
                .doesNotContain("GPS")
                .startsWith("RIFF");
        assertThat(clean).hasSize(24);
    }

    @Test
    void refusesWhatIsNotAnImage() {
        byte[] html = "<script>alert(1)</script>".getBytes(StandardCharsets.US_ASCII);
        assertThat(PhotoMetadata.strip("image/jpeg", html)).isEmpty();
        assertThat(PhotoMetadata.strip("image/png", html)).isEmpty();
        assertThat(PhotoMetadata.strip("image/webp", html)).isEmpty();
    }

    private static void check(String type, byte[] tagged) throws Exception {
        byte[] clean = PhotoMetadata.strip(type, tagged).orElseThrow();
        assertThat(new String(clean, StandardCharsets.ISO_8859_1)).doesNotContain("GPS");
        assertThat(ImageIO.read(new ByteArrayInputStream(clean)).getWidth()).isEqualTo(8);
    }

    private static byte[] image(String format) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(8, 8, BufferedImage.TYPE_INT_RGB), format, out);
        return out.toByteArray();
    }
}
