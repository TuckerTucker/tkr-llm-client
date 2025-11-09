"""
Unit tests for GPT-OSS Adapter

Tests the adapter that bridges FastAPI to gpt-oss-20b (MLX) inference engine.
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from typing import List, Dict, Any

# Import adapter modules (adjust paths as needed)
try:
    from llm_server.adapters.gpt_oss_adapter import (
        GPTOSSAdapter,
        ModelConfig,
        DeviceType,
        GenerationParams,
        GenerationResult,
        StreamChunk,
    )
except ImportError:
    pytest.skip("Adapter module not available", allow_module_level=True)


@pytest.fixture
def adapter_config():
    """Create test configuration for adapter"""
    return ModelConfig(
        model_path="/path/to/test/model",
        model_name="phi-3-mini",
        device=DeviceType.CPU,
        quantization="int4",
    )


@pytest.fixture
def mock_inference_engine():
    """Mock the gpt-oss-20b (MLX) inference engine"""
    mock = Mock()
    mock.load_model = AsyncMock()
    mock.unload_model = AsyncMock()
    mock.generate = AsyncMock()
    mock.generate_stream = AsyncMock()
    mock.is_loaded = Mock(return_value=True)
    return mock


class TestAdapterInitialization:
    """Test adapter initialization and configuration"""

    def test_adapter_initialization(self, adapter_config):
        """Test adapter initializes correctly"""
        adapter = GPTOSSAdapter(adapter_config)

        assert adapter.config == adapter_config
        assert adapter.config.model_name == "phi-3-mini"
        assert adapter.config.device == DeviceType.CPU
        assert adapter.config.quantization == "int4"

    def test_adapter_not_loaded_initially(self, adapter_config):
        """Test adapter is not loaded on initialization"""
        adapter = GPTOSSAdapter(adapter_config)

        assert not adapter.is_loaded()

    def test_config_validation(self):
        """Test configuration validation"""
        # Valid configurations should not raise errors
        valid_config = ModelConfig(
            model_path="/valid/path",
            model_name="phi-3-mini",
            device=DeviceType.AUTO,
            quantization="int4",
        )
        adapter = GPTOSSAdapter(valid_config)
        assert adapter is not None

    def test_device_type_enum(self):
        """Test DeviceType enum values"""
        assert DeviceType.AUTO.value == "auto"
        assert DeviceType.MPS.value == "mps"
        assert DeviceType.CPU.value == "cpu"


class TestModelLoading:
    """Test model loading and unloading"""

    @pytest.mark.asyncio
    async def test_load_model(self, adapter_config, mock_inference_engine):
        """Test model loading"""
        with patch('llm_server.adapters.gpt_oss_adapter.InferenceEngine', return_value=mock_inference_engine):
            adapter = GPTOSSAdapter(adapter_config)
            await adapter.load_model()

            mock_inference_engine.load_model.assert_called_once()
            assert adapter.is_loaded()

    @pytest.mark.asyncio
    async def test_unload_model(self, adapter_config, mock_inference_engine):
        """Test model unloading"""
        with patch('llm_server.adapters.gpt_oss_adapter.InferenceEngine', return_value=mock_inference_engine):
            adapter = GPTOSSAdapter(adapter_config)
            await adapter.load_model()
            await adapter.unload_model()

            mock_inference_engine.unload_model.assert_called_once()
            assert not adapter.is_loaded()

    @pytest.mark.asyncio
    async def test_load_model_failure(self, adapter_config):
        """Test handling of model loading failure"""
        mock_engine = Mock()
        mock_engine.load_model = AsyncMock(side_effect=RuntimeError("Model not found"))

        with patch('llm_server.adapters.gpt_oss_adapter.InferenceEngine', return_value=mock_engine):
            adapter = GPTOSSAdapter(adapter_config)

            with pytest.raises(RuntimeError, match="Model not found"):
                await adapter.load_model()

            assert not adapter.is_loaded()


class TestPromptBuilding:
    """Test message to prompt conversion"""

    def test_build_prompt_simple(self, adapter_config):
        """Test simple prompt building"""
        adapter = GPTOSSAdapter(adapter_config)
        messages = [
            {"role": "user", "content": "Hello"}
        ]

        prompt = adapter._build_prompt(messages)

        assert "<|user|>Hello" in prompt
        assert prompt.endswith("<|assistant|>")

    def test_build_prompt_with_system(self, adapter_config):
        """Test prompt building with system message"""
        adapter = GPTOSSAdapter(adapter_config)
        messages = [
            {"role": "system", "content": "You are helpful"},
            {"role": "user", "content": "Hi"}
        ]

        prompt = adapter._build_prompt(messages)

        assert "<|system|>You are helpful" in prompt
        assert "<|user|>Hi" in prompt
        assert prompt.endswith("<|assistant|>")

    def test_build_prompt_conversation(self, adapter_config):
        """Test prompt building for multi-turn conversation"""
        adapter = GPTOSSAdapter(adapter_config)
        messages = [
            {"role": "system", "content": "You are helpful"},
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi there!"},
            {"role": "user", "content": "How are you?"}
        ]

        prompt = adapter._build_prompt(messages)

        assert "<|system|>You are helpful" in prompt
        assert "<|user|>Hello" in prompt
        assert "<|assistant|>Hi there!" in prompt
        assert "<|user|>How are you?" in prompt
        assert prompt.endswith("<|assistant|>")

    def test_build_prompt_empty_messages(self, adapter_config):
        """Test prompt building with empty message list"""
        adapter = GPTOSSAdapter(adapter_config)
        messages = []

        prompt = adapter._build_prompt(messages)

        assert prompt == "<|assistant|>" or len(prompt) == 0


class TestGeneration:
    """Test text generation"""

    @pytest.mark.asyncio
    async def test_generate_simple(self, adapter_config):
        """Test basic generation"""
        mock_engine = Mock()
        mock_result = GenerationResult(
            text="Hello! How can I help?",
            tokens_generated=6,
            finish_reason="stop",
            prompt_tokens=5,
            completion_tokens=6,
        )
        mock_engine.generate = AsyncMock(return_value=mock_result)
        mock_engine.load_model = AsyncMock()
        mock_engine.is_loaded = Mock(return_value=True)

        with patch('llm_server.adapters.gpt_oss_adapter.InferenceEngine', return_value=mock_engine):
            adapter = GPTOSSAdapter(adapter_config)
            await adapter.load_model()

            messages = [{"role": "user", "content": "Hello"}]
            params = GenerationParams(max_tokens=10)

            result = await adapter.generate(messages, params)

            assert result.text == "Hello! How can I help?"
            assert result.tokens_generated > 0
            assert result.finish_reason in ["stop", "length"]
            assert result.prompt_tokens > 0

    @pytest.mark.asyncio
    async def test_generate_with_parameters(self, adapter_config):
        """Test generation with custom parameters"""
        mock_engine = Mock()
        mock_result = GenerationResult(
            text="Response",
            tokens_generated=1,
            finish_reason="stop",
            prompt_tokens=3,
            completion_tokens=1,
        )
        mock_engine.generate = AsyncMock(return_value=mock_result)
        mock_engine.load_model = AsyncMock()
        mock_engine.is_loaded = Mock(return_value=True)

        with patch('llm_server.adapters.gpt_oss_adapter.InferenceEngine', return_value=mock_engine):
            adapter = GPTOSSAdapter(adapter_config)
            await adapter.load_model()

            messages = [{"role": "user", "content": "Test"}]
            params = GenerationParams(
                max_tokens=50,
                temperature=0.8,
                top_p=0.95,
            )

            result = await adapter.generate(messages, params)

            assert result is not None
            mock_engine.generate.assert_called_once()

    @pytest.mark.asyncio
    async def test_generate_model_not_loaded(self, adapter_config):
        """Test generation fails when model not loaded"""
        adapter = GPTOSSAdapter(adapter_config)

        messages = [{"role": "user", "content": "Test"}]
        params = GenerationParams(max_tokens=10)

        with pytest.raises(RuntimeError, match="Model not loaded"):
            await adapter.generate(messages, params)


class TestStreamingGeneration:
    """Test streaming generation"""

    @pytest.mark.asyncio
    async def test_generate_stream(self, adapter_config):
        """Test streaming generation"""
        mock_engine = Mock()

        async def mock_stream():
            chunks = [
                StreamChunk(delta="Hello", is_final=False),
                StreamChunk(delta=" there", is_final=False),
                StreamChunk(delta="!", is_final=True, finish_reason="stop"),
            ]
            for chunk in chunks:
                yield chunk

        mock_engine.generate_stream = mock_stream
        mock_engine.load_model = AsyncMock()
        mock_engine.is_loaded = Mock(return_value=True)

        with patch('llm_server.adapters.gpt_oss_adapter.InferenceEngine', return_value=mock_engine):
            adapter = GPTOSSAdapter(adapter_config)
            await adapter.load_model()

            messages = [{"role": "user", "content": "Say hello"}]
            params = GenerationParams(max_tokens=20)

            chunks = []
            async for chunk in adapter.generate_stream(messages, params):
                chunks.append(chunk)

            assert len(chunks) == 3
            assert chunks[0].delta == "Hello"
            assert chunks[1].delta == " there"
            assert chunks[2].is_final
            assert chunks[2].finish_reason == "stop"

    @pytest.mark.asyncio
    async def test_stream_model_not_loaded(self, adapter_config):
        """Test streaming fails when model not loaded"""
        adapter = GPTOSSAdapter(adapter_config)

        messages = [{"role": "user", "content": "Test"}]
        params = GenerationParams(max_tokens=10)

        with pytest.raises(RuntimeError, match="Model not loaded"):
            async for _ in adapter.generate_stream(messages, params):
                pass


class TestTokenCounting:
    """Test token counting functionality"""

    def test_count_tokens(self, adapter_config):
        """Test token counting"""
        adapter = GPTOSSAdapter(adapter_config)

        text = "Hello, how are you today?"
        token_count = adapter.count_tokens(text)

        # Approximate token count (depends on tokenizer)
        assert token_count > 0
        assert isinstance(token_count, int)

    def test_count_tokens_empty(self, adapter_config):
        """Test token counting with empty text"""
        adapter = GPTOSSAdapter(adapter_config)

        token_count = adapter.count_tokens("")

        assert token_count == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
