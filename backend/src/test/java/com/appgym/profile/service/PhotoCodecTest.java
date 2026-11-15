package com.appgym.profile.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.appgym.shared.error.BadRequestException;
import com.appgym.user.domain.UserPhoto;
import java.util.Base64;
import org.junit.jupiter.api.Test;

class PhotoCodecTest {

    @Test
    void decodesAndEncodesBack() {
        String dataUrl = "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(new byte[] {1, 2, 3});
        PhotoCodec.Decoded decoded = PhotoCodec.decode(dataUrl);
        assertThat(decoded.contentType()).isEqualTo("image/jpeg");
        assertThat(decoded.data()).containsExactly(1, 2, 3);

        UserPhoto photo = new UserPhoto(1L);
        photo.replace(decoded.contentType(), decoded.data());
        assertThat(PhotoCodec.encode(photo)).isEqualTo(dataUrl);
    }

    @Test
    void rejectsOtherTypesAndBrokenData() {
        assertThatThrownBy(() -> PhotoCodec.decode("data:image/gif;base64,AAAA"))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> PhotoCodec.decode("data:image/png;base64,***"))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> PhotoCodec.decode(null)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void rejectsPhotosOverTheLimit() {
        String big = Base64.getEncoder().encodeToString(new byte[PhotoCodec.MAX_BYTES + 1]);
        assertThatThrownBy(() -> PhotoCodec.decode("data:image/png;base64," + big))
                .hasMessage("A foto pode ter até 512 KB.");
    }
}
