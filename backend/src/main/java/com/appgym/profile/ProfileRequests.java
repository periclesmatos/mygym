package com.appgym.profile;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public final class ProfileRequests {
    private ProfileRequests() {}

    public record Update(
            @Size(max = 80, message = "O nome pode ter até 80 caracteres.")
            String name,

            @DecimalMin(value = "20", message = "Peso deve ficar entre 20 e 400 kg.")
            @DecimalMax(value = "400", message = "Peso deve ficar entre 20 e 400 kg.")
            BigDecimal weightKg,

            @Min(value = 80, message = "Altura deve ficar entre 80 e 250 cm.")
            @Max(value = 250, message = "Altura deve ficar entre 80 e 250 cm.")
            Integer heightCm,

            @Past(message = "A data de nascimento precisa estar no passado.")
            LocalDate birthDate) {}

    public record Photo(
            @NotBlank(message = "Envie uma imagem.") String dataUrl) {}

    public record Email(
            @NotBlank(message = "Informe o novo e-mail.")
            @jakarta.validation.constraints.Email(message = "E-mail inválido.")
            String email,

            @NotBlank(message = "Informe a senha atual.") String currentPassword) {}

    public record Password(
            String currentPassword,

            @NotBlank(message = "Informe a nova senha.")
            @Size(min = 6, max = 100, message = "A senha precisa ter de 6 a 100 caracteres.")
            String newPassword) {}
}
