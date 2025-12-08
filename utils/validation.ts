import * as Yup from 'yup';

export const registerSchema = Yup.object({
  name: Yup.string().required('İsim zorunlu alan'),
  surname: Yup.string().required('Soyisim zorunlu alan'),
  password: Yup.string()
    .matches(/^[A-Za-z0-9.,!?\/]*$/, 'Geçersiz karakter içeriyor')
    .min(8, "Şifre en az 8 karakter olmalıdır")
    .required("Zorunlu alan"),
  email: Yup.string().email("Geçerli bir e-posta sağlayın").required("Zorunlu alan"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), undefined], 'Şifreler uyuşmalı')
    .required('Zorunlu alan'),
  complianceModal: Yup.boolean()
});

export const loginSchema = Yup.object({
  password: Yup.string()
    .matches(/^[A-Za-z0-9.,!?\/]*$/, 'Geçersiz karakter içeriyor')
    .min(8, "Şifre en az 8 karakter olmalıdır")
    .required("Zorunlu alan"),
  email: Yup.string().email("Geçerli bir e-posta sağlayın").required("Zorunlu alan"),
});

export const forgotPasswordSchema = Yup.object({
  email: Yup.string().email("Geçerli bir e-posta sağlayın").required("Zorunlu alan"),
});

export const getResetPasswordSchema = (t: (key: string) => string) => Yup.object({
  passwordToken: Yup.number()
    .required(t("validation.codeRequired"))
    .test('len', t("validation.codeLength"), val => val?.toString().length === 4),
  newPassword: Yup.string()
    .min(8, t("validation.passwordMinLength8"))
    .required(t("validation.fieldRequired")),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword'), undefined], t("validation.passwordsNotMatch"))
    .required(t("validation.fieldRequired")),
});

export const detailsProfileSchema = Yup.object({
  name: Yup.string().required("Zorunlu alan"),
  email: Yup.string().email("Geçerli bir e-posta sağlayın").required("Zorunlu alan"),
  password: Yup.string().min(8, "Şifre en az 8 karakter olmalıdır").required("Zorunlu alan"),
  confirmPassword: Yup.string().oneOf([Yup.ref('password'), undefined], 'Şifreler uyuşmalı').required('Zorunlu alan'),
  phoneNumber: Yup.string().required("Zorunlu alan"),
  address: Yup.string().required("Zorunlu alan"),
  picture: Yup.string(),
});

export const personalInfoSchema = Yup.object().shape({
  firstName: Yup.string().required('İsim gerekli'),
  lastName: Yup.string().required('Soyisim gerekli'),
  tc: Yup.string()
    .matches(/^[1-9][0-9]{10}$/, 'Geçersiz T.C. Kimlik Numarası')
    .test('tc-validation', 'Geçersiz T.C. Kimlik Numarası', (value) => {
      if (!value) return false;
      const digits = value.split('').map(Number);
      const sumOfFirst10 = digits.slice(0, 10).reduce((acc, curr) => acc + curr, 0);
      return sumOfFirst10 % 10 === digits[10];
    })
    .required('T.C. Kimlik Numarası gerekli'),
  birthDate: Yup.string().required('Doğum Tarihi gerekli'),
  address: Yup.string().required('Adres gerekli'),
  phone: Yup.string()
    .matches(/^05\d{9}$/, 'Geçersiz Telefon Numarası')
    .required('Telefon Numarası gerekli'),
});